import { create } from "zustand";

export interface PendingMutation {
  id: string;
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  createdAt: number;
}

const DB_NAME = "yukchi-sync-queue";
const STORE_NAME = "mutations";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function getAllMutations(): Promise<PendingMutation[]> {
  if (typeof window === "undefined") return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      db.close();
      resolve((req.result ?? []) as PendingMutation[]);
    };
    req.onerror = () => reject(req.error);
  });
}

async function addMutation(m: PendingMutation): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(m);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function removeMutation(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

interface SyncQueueState {
  pending: PendingMutation[];
  pendingCount: number;
  load: () => Promise<void>;
  enqueue: (m: Omit<PendingMutation, "id" | "createdAt">) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSyncQueue = create<SyncQueueState>((set, get) => ({
  pending: [],
  pendingCount: 0,

  load: async () => {
    const pending = await getAllMutations();
    set({ pending, pendingCount: pending.length });
  },

  enqueue: async (m) => {
    const mutation: PendingMutation = {
      ...m,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await addMutation(mutation);
    set((s) => ({
      pending: [...s.pending, mutation],
      pendingCount: s.pendingCount + 1,
    }));
  },

  remove: async (id) => {
    await removeMutation(id);
    set((s) => ({
      pending: s.pending.filter((p) => p.id !== id),
      pendingCount: Math.max(0, s.pendingCount - 1),
    }));
  },
}));
