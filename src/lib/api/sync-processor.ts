/**
 * Processes pending mutations when back online.
 */

import { api } from "./client";
import { useSyncQueue } from "@/stores/sync-queue";

export async function processSyncQueue(): Promise<void> {
  const { load, pending, remove } = useSyncQueue.getState();
  await load();
  const list = useSyncQueue.getState().pending;

  for (const m of list) {
    try {
      if (m.method === "POST") {
        await api.post(m.path, m.body);
      } else if (m.method === "PATCH") {
        await api.patch(m.path, m.body);
      } else if (m.method === "DELETE") {
        await api.delete(m.path);
      }
      await remove(m.id);
    } catch {
      // Keep in queue for next retry
    }
  }
}
