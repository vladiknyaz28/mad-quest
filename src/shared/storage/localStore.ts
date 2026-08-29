import type { QuestProgress } from '../../features/quest/questTypes';
import { presetUrl } from '../../features/quest/data/presetBackgrounds';
import { BG_STORE, openQuestDb } from './idb';

const PROGRESS_KEY = 'mad-quest-progress-v2';
const LEGACY_PROGRESS_KEY = 'mad-quest-progress';
const BG_META_KEY = 'mad-quest-bg-meta';
const BG_ID = 'main-background';

export type BackgroundSource = 'preset' | 'file';

export interface BackgroundMeta {
  source: BackgroundSource;
  name: string;
  presetFile?: string;
  mimeType?: string;
  updatedAt: number;
}

interface ProgressStore {
  quests: Record<string, QuestProgress>;
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function readStore(): ProgressStore {
  const raw = safeGetItem(PROGRESS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ProgressStore;
      if (parsed.quests && typeof parsed.quests === 'object') return parsed;
    } catch {
      /* fall through */
    }
  }

  const legacyRaw = safeGetItem(LEGACY_PROGRESS_KEY);
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw) as QuestProgress;
      if (legacy.questId) {
        const migrated: ProgressStore = { quests: { [legacy.questId]: legacy } };
        safeSetItem(PROGRESS_KEY, JSON.stringify(migrated));
        safeRemoveItem(LEGACY_PROGRESS_KEY);
        return migrated;
      }
    } catch {
      /* ignore */
    }
  }

  return { quests: {} };
}

function writeStore(store: ProgressStore): void {
  safeSetItem(PROGRESS_KEY, JSON.stringify(store));
}

export function saveProgress(progress: QuestProgress): void {
  const store = readStore();
  store.quests[progress.questId] = progress;
  writeStore(store);
}

export function loadProgress(questId: string): QuestProgress | null {
  return readStore().quests[questId] ?? null;
}

/** Прогресс всех сценариев (для списка на главной). */
export function loadAllProgress(): Record<string, QuestProgress> {
  return readStore().quests;
}

export function clearProgress(questId?: string): void {
  if (questId) {
    const store = readStore();
    delete store.quests[questId];
    writeStore(store);
    return;
  }
  safeRemoveItem(PROGRESS_KEY);
  safeRemoveItem(LEGACY_PROGRESS_KEY);
}

export function getBackgroundMeta(): BackgroundMeta | null {
  const raw = safeGetItem(BG_META_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BackgroundMeta & { mimeType?: string };
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

export async function saveBackgroundPreset(name: string, file: string): Promise<string> {
  void clearStoredFile().catch(() => {});
  const meta: BackgroundMeta = {
    source: 'preset',
    name,
    presetFile: file,
    updatedAt: Date.now(),
  };
  safeSetItem(BG_META_KEY, JSON.stringify(meta));
  return presetUrl(file);
}

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
  safeSetItem(BG_META_KEY, JSON.stringify(meta));

  return URL.createObjectURL(new Blob([buffer], { type: meta.mimeType }));
}

export async function loadBackgroundUrl(): Promise<string | null> {
  const meta = getBackgroundMeta();
  if (!meta) return null;

  if (meta.source === 'preset' && meta.presetFile) {
    return presetUrl(meta.presetFile);
  }

  try {
    const db = await openQuestDb();
    const buffer = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(BG_STORE, 'readonly');
      const request = tx.objectStore(BG_STORE).get(BG_ID);
      request.onsuccess = () => resolve((request.result as ArrayBuffer | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });

    if (!buffer) return null;
    return URL.createObjectURL(new Blob([buffer], { type: meta.mimeType || 'image/jpeg' }));
  } catch {
    return null;
  }
}

export async function clearBackground(): Promise<void> {
  safeRemoveItem(BG_META_KEY);
  await clearStoredFile().catch(() => {});
}
