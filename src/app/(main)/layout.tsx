"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { SyncProcessor } from "@/components/providers/SyncProcessor";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { motion } from "framer-motion";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <RouteGuard>
        <SyncProcessor />
        <div className="mobile-container bg-background">
          <Header />
          <OfflineBanner />
          <main
            className="px-4 pt-5 min-h-[calc(100dvh-8rem)]"
            style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </main>
          <BottomNav />
        </div>
      </RouteGuard>
    </ErrorBoundary>
  );
}
