"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncQueue } from "@/stores/sync-queue";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const pendingCount = useSyncQueue((s) => s.pendingCount);

  if (isOnline && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div
          className={
            pendingCount > 0 && isOnline
              ? "flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-amber-500/20 text-amber-200"
              : "flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-muted text-muted-foreground"
          }
        >
          <WifiOff className="size-4 shrink-0" />
          <span>
            {!isOnline
              ? "Нет соединения. Данные будут синхронизированы при подключении"
              : `${pendingCount} действий ожидают синхронизации`}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
