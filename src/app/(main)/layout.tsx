"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
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
        <div className="mobile-container bg-background">
          <Header />
          <main className="px-4 pt-5 pb-24 min-h-[calc(100dvh-8rem)]">
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
