"use client";

import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncQueue } from "@/stores/sync-queue";
import { processSyncQueue } from "@/lib/api/sync-processor";

/**
 * Loads sync queue on mount and processes pending mutations when back online.
 */
export function SyncProcessor() {
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    useSyncQueue.getState().load();
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    processSyncQueue();
  }, [isOnline]);

  return null;
}
