"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setApiTokenGetter } from "@/lib/api/api-token";
import { setOnUnauthorized } from "@/lib/api/on-unauthorized";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";

/**
 * Sets the API token getter and 401 handler.
 * Must run early so API calls use the persisted token after rehydration.
 */
export function ApiTokenProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    setApiTokenGetter(() => useAuthStore.getState().accessToken);
    setOnUnauthorized(() => {
      useAuthStore.getState().logout();
      toast.error("Сессия истекла. Войдите снова");
      router.replace("/login");
    });
  }, [router]);
  return <>{children}</>;
}
