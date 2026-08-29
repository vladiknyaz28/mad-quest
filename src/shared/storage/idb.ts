const IDB_NAME = 'mad-quest-db';
const IDB_VERSION = 2;
const IDB_TIMEOUT_MS = 4000;

export const BG_STORE = 'backgrounds';
/** Устарело: клипы больше не в IDB, store может остаться пустым. */
export const CLIPS_STORE = 'clips';

function withTimeout<T>(promise: Promise<T>, ms = IDB_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('idb-timeout')), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** БД приложения: backgrounds (+ устаревший clips). */
export function openQuestDb(): Promise<IDBDatabase> {
  const open = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB-unavailable'));
      return;
    }

    const request = indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BG_STORE)) {
        db.createObjectStore(BG_STORE);
      }
      if (!db.objectStoreNames.contains(CLIPS_STORE)) {
        db.createObjectStore(CLIPS_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return withTimeout(open);
}
