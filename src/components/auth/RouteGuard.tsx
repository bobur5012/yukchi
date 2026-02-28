"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

const ADMIN_ONLY_PATHS = ["/couriers"];
const AUTH_PATH = "/login";

function isAdminOnly(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (pathname === AUTH_PATH) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      }
      return;
    }

    if (!isAuthenticated) {
      router.replace(AUTH_PATH);
      return;
    }

    if (user?.role === "courier" && isAdminOnly(pathname)) {
      router.replace("/dashboard");
    }
  }, [_hasHydrated, isAuthenticated, user?.role, pathname, router]);

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (pathname === AUTH_PATH) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Проверка доступа...</p>
      </div>
    );
  }

  if (user?.role === "courier" && isAdminOnly(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Нет доступа...</p>
      </div>
    );
  }

  return <>{children}</>;
}
