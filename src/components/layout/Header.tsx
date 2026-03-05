"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import { useAuthStore } from "@/stores/auth";
import { getCourier } from "@/lib/api/couriers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";

const TITLE_KEYS: Record<string, string> = {
  "/dashboard":     "titles.home",
  "/trips":         "nav.trips",
  "/trips/new":     "titles.newTrip",
  "/products":      "titles.products",
  "/products/new":  "titles.newProduct",
  "/shops":         "titles.shops",
  "/shops/new":     "titles.newDebt",
  "/couriers":      "titles.couriers",
  "/couriers/new":  "titles.newCourier",
  "/profile":       "titles.profile",
};

function getTitleKey(pathname: string): string {
  if (TITLE_KEYS[pathname]) return TITLE_KEYS[pathname];
  if (pathname.match(/^\/trips\/[^/]+\/expenses\/new$/)) return "titles.addExpense";
  if (pathname.match(/^\/trips\/[^/]+$/))               return "titles.trip";
  if (pathname.match(/^\/shops\/[^/]+\/debt\/new$/))     return "titles.addDebt";
  if (pathname.match(/^\/shops\/[^/]+\/payments\/new$/)) return "titles.payment";
  if (pathname.match(/^\/shops\/[^/]+$/))                return "titles.shop";
  return "Yukchi";
}

function shouldShowBack(pathname: string): boolean {
  return (
    /^\/(trips|shops|couriers)\/[^/]+$/.test(pathname) ||
    /^\/trips\/[^/]+\/expenses\/new$/.test(pathname)   ||
    /^\/shops\/[^/]+\/debt\/new$/.test(pathname)       ||
    /^\/shops\/[^/]+\/payments\/new$/.test(pathname)   ||
    pathname === "/trips/new"    ||
    pathname === "/products/new" ||
    pathname === "/shops/new"    ||
    pathname === "/couriers/new"
  );
}

function getBackHref(pathname: string): string | undefined {
  if (/^\/trips\/[^/]+\/expenses\/new$/.test(pathname)) {
    const m = pathname.match(/^\/trips\/([^/]+)\/expenses\/new$/);
    return m ? `/trips/${m[1]}` : "/trips";
  }
  if (/^\/shops\/[^/]+\/(debt|payments)\/new$/.test(pathname)) {
    const m = pathname.match(/^\/shops\/([^/]+)\//);
    return m ? `/shops/${m[1]}` : "/shops";
  }
  if (pathname.startsWith("/trips/"))    return "/trips";
  if (pathname.startsWith("/shops/"))    return "/shops";
  if (pathname.startsWith("/couriers/")) return "/couriers";
  if (pathname === "/products/new")      return "/products";
  if (pathname === "/shops/new")         return "/shops";
  return undefined;
}

interface HeaderProps { title?: string }

function getInitials(name?: string): string {
  const value = name?.trim();
  if (!value) return "?";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
}

export function Header({ title }: HeaderProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [courierAvatarUrl, setCourierAvatarUrl] = useState<string | null>(null);
  const titleKey = getTitleKey(pathname);
  const displayTitle = title ?? (titleKey.startsWith("titles.") || titleKey.startsWith("nav.") ? t(titleKey) : titleKey);
  const showBack = shouldShowBack(pathname);
  const backHref = getBackHref(pathname);

  useEffect(() => {
    let cancelled = false;

    if (user?.role !== "courier" || !user.id) {
      setCourierAvatarUrl(null);
      return;
    }

    getCourier(user.id)
      .then((courier) => {
        if (!cancelled) {
          setCourierAvatarUrl(courier.avatarUrl ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCourierAvatarUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  const avatarSrc =
    user?.role === "courier"
      ? getAvatarUrl(courierAvatarUrl, courierAvatarUrl ?? user.id)
      : undefined;
  const avatarFallback = getInitials(user?.name ?? t("common.user"));

  return (
    <header
      className="sticky top-0 z-40 w-full max-w-[430px] mx-auto
        bg-card/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/75
        border-b border-border/30"
      style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
    >
      <div className="grid h-12 grid-cols-[72px_1fr_72px] items-center gap-1 px-2">
        <div className="flex items-center justify-start">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex h-9 items-center gap-0.5 rounded-[10px] px-2 text-[16px] font-medium text-primary transition-colors hover:bg-accent active:bg-accent/80"
            >
              <ChevronLeft className="size-5 -ml-1" strokeWidth={2.5} />
              <span className="leading-none">{t("nav.back")}</span>
            </button>
          ) : null}
        </div>
        <h1 className="flex-1 text-[17px] font-semibold truncate tracking-[-0.02em] text-center px-2">
          {displayTitle}
        </h1>
        <div className="flex items-center justify-end">
          <Link
            href="/profile"
            className="flex size-10 items-center justify-center rounded-full border border-border/40 bg-background/70 transition-colors hover:bg-accent"
            aria-label={t("nav.profile")}
          >
            <Avatar size="default" className="size-8">
              {avatarSrc ? <AvatarImage src={avatarSrc} alt={user?.name ?? t("nav.profile")} /> : null}
              <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
