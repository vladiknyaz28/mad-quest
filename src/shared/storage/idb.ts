const IDB_NAME = 'mad-quest-db';
const IDB_VERSION = 2;

export const BG_STORE = 'backgrounds';
/** Устарело: клипы больше не в IDB, store может остаться пустым. */
export const CLIPS_STORE = 'clips';

/** БД приложения: backgrounds (+ устаревший clips). */
export function openQuestDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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
}
