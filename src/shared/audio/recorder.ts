/**
 * Запись голоса:
 * 1) сразу сохраняется на устройстве (IndexedDB) — работает с телефона/ПК;
 * 2) опционально скачивается файл для public/audio/ и деплоя.
 */

import { CLIPS_STORE, openQuestDb } from '../storage/idb';
import { suggestedDownloadName } from './audioManifest';

type RecorderListener = (state: RecorderState) => void;

export interface RecorderState {
  ready: boolean;
  recordingKey: string | null;
  clipsVersion: number;
}

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

class VoiceRecorder {
  private memory = new Map<string, Blob>();
  private urls = new Map<string, string>();
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private activeKey: string | null = null;
  private initPromise: Promise<void> | null = null;
  private state: RecorderState = { ready: false, recordingKey: null, clipsVersion: 0 };
  private listeners = new Set<RecorderListener>();

  subscribe(listener: RecorderListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): RecorderState {
    return this.state;
  }

  private setState(partial: Partial<RecorderState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.loadAll();
    return this.initPromise;
  }

  private async loadAll(): Promise<void> {
    try {
      const db = await openQuestDb();
      const entries = await new Promise<[string, Blob][]>((resolve, reject) => {
        const tx = db.transaction(CLIPS_STORE, 'readonly');
        const store = tx.objectStore(CLIPS_STORE);
        const request = store.openCursor();
        const result: [string, Blob][] = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve(result);
            return;
          }
          const key = String(cursor.key);
          const value = cursor.value;
          if (value instanceof Blob) result.push([key, value]);
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });

      for (const [key, blob] of entries) {
        this.setMemory(key, blob);
      }
    } catch {
      // IndexedDB недоступен — запись всё равно может скачивать файлы
    }
    this.setState({ ready: true, clipsVersion: this.state.clipsVersion + 1 });
  }

  private setMemory(key: string, blob: Blob): void {
    const prev = this.urls.get(key);
    if (prev) URL.revokeObjectURL(prev);
    this.memory.set(key, blob);
    this.urls.set(key, URL.createObjectURL(blob));
  }

  hasRecording(key: string): boolean {
    return this.memory.has(key);
  }

  listRecordingKeys(): string[] {
    return [...this.memory.keys()];
  }

  getRecordingUrl(key: string): string | null {
    return this.urls.get(key) ?? null;
  }

  getRecordingBlob(key: string): Blob | null {
    return this.memory.get(key) ?? null;
  }

  /** Сколько клипов записано на этом устройстве. */
  recordingCount(): number {
    return this.memory.size;
  }

  async startRecording(key: string): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      await this.stopRecording({ download: false });
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;
    this.chunks = [];
    this.activeKey = key;

    const mimeType = pickMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    this.mediaRecorder = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };

    recorder.start(200);
    this.setState({ recordingKey: key });
  }

  /**
   * Стоп: сохранить в IndexedDB (+ опционально скачать для public/audio).
   */
  async stopRecording(options: { download?: boolean } = {}): Promise<Blob | null> {
    const { download = false } = options;
    const recorder = this.mediaRecorder;
    const key = this.activeKey;
    if (!recorder || !key) return null;

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        resolve(new Blob(this.chunks, { type }));
      };
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        recorder.stop();
      } else {
        resolve(new Blob(this.chunks, { type: recorder.mimeType || 'audio/webm' }));
      }
    });

    this.cleanupStream();
    this.mediaRecorder = null;
    this.activeKey = null;
    this.setState({ recordingKey: null });

    if (blob.size === 0) return null;

    this.setMemory(key, blob);
    await this.persistClip(key, blob);
    this.setState({ clipsVersion: this.state.clipsVersion + 1 });

    if (download) {
      downloadBlob(blob, suggestedDownloadName(key, blob.type));
    }

    return blob;
  }

  redownload(key: string): boolean {
    const blob = this.memory.get(key);
    if (!blob) return false;
    downloadBlob(blob, suggestedDownloadName(key, blob.type));
    return true;
  }

  /**
   * Скачать ZIP всех записей с этого устройства.
   * Распакуй в public/audio/ → commit → deploy — голос будет на всех устройствах.
   */
  async exportAllForDeploy(): Promise<{ count: number; filename: string }> {
    await this.init();
    const entries = [...this.memory.entries()];
    if (entries.length === 0) {
      throw new Error('Нет записей на этом устройстве');
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const folder = zip.folder('audio');
    if (!folder) throw new Error('ZIP error');

    folder.file(
      'README.txt',
      [
        'Голос полицейского Мэда',
        '',
        '1. Скопируй ВСЕ файлы из этой папки audio/ в проект:',
        '   public/audio/',
        '2. npm run build && npm run deploy',
        '3. На всех устройствах заиграют эти файлы.',
        '4. На устройстве пользователь может перезаписать голос локально.',
        '',
      ].join('\n'),
    );

    for (const [key, blob] of entries) {
      folder.file(suggestedDownloadName(key, blob.type), blob);
    }

    const out = await zip.generateAsync({ type: 'blob' });
    const filename = 'mad-quest-audio.zip';
    downloadBlob(out, filename);
    return { count: entries.length, filename };
  }

  async deleteRecording(key: string): Promise<void> {
    const url = this.urls.get(key);
    if (url) URL.revokeObjectURL(url);
    this.urls.delete(key);
    this.memory.delete(key);

    try {
      const db = await openQuestDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(CLIPS_STORE, 'readwrite');
        tx.objectStore(CLIPS_STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* ignore */
    }

    this.setState({ clipsVersion: this.state.clipsVersion + 1 });
  }

  private async persistClip(key: string, blob: Blob): Promise<void> {
    try {
      const db = await openQuestDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(CLIPS_STORE, 'readwrite');
        tx.objectStore(CLIPS_STORE).put(blob, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* локальное сохранение опционально */
    }
  }

  private cleanupStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.chunks = [];
  }
}

export const voiceRecorder = new VoiceRecorder();

export {
  storyClipKey,
  promptClipKey,
  puzzleClipKey,
  SYSTEM_OK_KEY,
  SYSTEM_WRONG_KEY,
  suggestedDownloadName,
  audioBaseNameForKey,
} from './audioManifest';
