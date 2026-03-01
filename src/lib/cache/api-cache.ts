/**
 * IndexedDB cache for API GET responses.
 * Used for offline-first: serve cached data when offline, refresh when online.
 */

const DB_NAME = "yukchi-api-cache";
const STORE_NAME = "responses";
const TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

function get(key: string): Promise<CacheEntry | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

function set(key: string, value: CacheEntry): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put({ key, ...value });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      })
  );
}

function del(key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      })
  );
}

function keys(): Promise<string[]> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).getAllKeys();
        req.onsuccess = () => resolve((req.result ?? []).map((k) => String(k)));
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

export function getCacheKey(path: string, params?: Record<string, string>): string {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  return path + q;
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const row = await get(key);
    if (!row || !("data" in row)) return null;
    const entry = row as unknown as CacheEntry;
    const age = Date.now() - entry.timestamp;
    if (age > TTL_MS) return null;
    return entry.data as T;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: unknown): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await set(key, { data, timestamp: Date.now() });
  } catch {
    // ignore cache write errors
  }
}

export async function clearCached(prefix?: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const allKeys = await keys();
    const targetKeys = prefix ? allKeys.filter((k) => k.startsWith(prefix)) : allKeys;
    await Promise.all(targetKeys.map((k) => del(k)));
  } catch {
    // ignore cache clear errors
  }
}
