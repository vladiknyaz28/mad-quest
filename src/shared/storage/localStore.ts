import type { QuestProgress } from '../../features/quest/questTypes';
import { BG_STORE, openQuestDb } from './idb';
import { presetUrl } from '../../features/quest/data/presetBackgrounds';

const PROGRESS_KEY = 'mad-quest-progress';
const BG_META_KEY = 'mad-quest-bg-meta';
const BG_ID = 'main-background';

export type BackgroundSource = 'preset' | 'file';

export interface BackgroundMeta {
  source: BackgroundSource;
  name: string;
  /** Для preset — относительный путь файла. */
  presetFile?: string;
  mimeType?: string;
  updatedAt: number;
}

export function saveProgress(progress: QuestProgress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadProgress(questId: string): QuestProgress | null {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QuestProgress;
    if (parsed.questId !== questId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
}

export function getBackgroundMeta(): BackgroundMeta | null {
  const raw = localStorage.getItem(BG_META_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BackgroundMeta & { mimeType?: string };
    // Миграция старого формата (только файл без source)
    if (!parsed.source && parsed.mimeType) {
      return { ...parsed, source: 'file' };
    }
    return parsed;
  } catch {
    return null;
  }
}

async function clearStoredFile(): Promise<void> {
  const db = await openQuestDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BG_STORE, 'readwrite');
    tx.objectStore(BG_STORE).delete(BG_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Выбрать встроенный фон. */
export async function saveBackgroundPreset(name: string, file: string): Promise<string> {
  await clearStoredFile();
  const meta: BackgroundMeta = {
    source: 'preset',
    name,
    presetFile: file,
    updatedAt: Date.now(),
  };
  localStorage.setItem(BG_META_KEY, JSON.stringify(meta));
  return presetUrl(file);
}

/** Сохранить файл фона с ПК в IndexedDB. */
export async function saveBackgroundFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const db = await openQuestDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BG_STORE, 'readwrite');
    tx.objectStore(BG_STORE).put(buffer, BG_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  const meta: BackgroundMeta = {
    source: 'file',
    name: file.name,
    mimeType: file.type || 'image/jpeg',
    updatedAt: Date.now(),
  };
  localStorage.setItem(BG_META_KEY, JSON.stringify(meta));

  return URL.createObjectURL(new Blob([buffer], { type: meta.mimeType }));
}

/** Загрузить текущий фон (preset URL или blob URL). */
export async function loadBackgroundUrl(): Promise<string | null> {
  const meta = getBackgroundMeta();
  if (!meta) return null;

  if (meta.source === 'preset' && meta.presetFile) {
    return presetUrl(meta.presetFile);
  }

  const db = await openQuestDb();
  const buffer = await new Promise<ArrayBuffer | null>((resolve, reject) => {
    const tx = db.transaction(BG_STORE, 'readonly');
    const request = tx.objectStore(BG_STORE).get(BG_ID);
    request.onsuccess = () => resolve((request.result as ArrayBuffer | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });

  if (!buffer) return null;
  return URL.createObjectURL(new Blob([buffer], { type: meta.mimeType || 'image/jpeg' }));
}

export async function clearBackground(): Promise<void> {
  localStorage.removeItem(BG_META_KEY);
  await clearStoredFile();
}
