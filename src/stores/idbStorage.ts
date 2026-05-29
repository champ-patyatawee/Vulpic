/**
 * IndexedDB storage adapter for Zustand persist middleware.
 * Handles large data (base64 images) without quota issues.
 */
const DB_NAME = "vulpic";
const STORE_NAME = "zustand";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(name);
        req.onsuccess = () => {
          resolve((req.result as string) ?? null);
          db.close();
        };
        req.onerror = () => {
          reject(req.error);
          db.close();
        };
      });
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, name);
      req.onsuccess = () => {
        resolve();
        db.close();
      };
      req.onerror = () => {
        reject(req.error);
        db.close();
      };
    });
  },

  removeItem: async (name: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(name);
      req.onsuccess = () => {
        resolve();
        db.close();
      };
      req.onerror = () => {
        reject(req.error);
        db.close();
      };
    });
  },
};
