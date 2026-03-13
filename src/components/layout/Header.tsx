"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";
import { getCurrentUserProfile } from "@/lib/api/users";

const TITLE_KEYS: Record<string, string> = {
  "/dashboard":     "titles.home",
  "/trips":         "nav.trips",
  "/trips/new":     "titles.newTrip",
  "/products":      "titles.products",
  "/products/new":  "titles.newProduct",
  "/telegram":      "titles.telegram",
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
    pathname === "/telegram"     ||
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
  if (pathname === "/telegram")          return "/profile";
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
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const titleKey = getTitleKey(pathname);
  const displayTitle = title ?? (titleKey.startsWith("titles.") || titleKey.startsWith("nav.") ? t(titleKey) : titleKey);
  const showBack = shouldShowBack(pathname);
  const backHref = getBackHref(pathname);

  useEffect(() => {
    let cancelled = false;

    if (!hasHydrated || !user?.id) {
      return;
    }

    getCurrentUserProfile()
      .then((profile) => {
        if (!cancelled) {
          setProfileAvatarUrl(profile.avatarUrl ?? null);
          updateUser({
            name: profile.name,
            phone: profile.phone,
            avatarUrl: profile.avatarUrl ?? null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfileAvatarUrl(user.avatarUrl ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, updateUser, user?.avatarUrl, user?.id]);

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  const avatarSrc =
    user?.role === "courier"
      ? getAvatarUrl(profileAvatarUrl ?? user.avatarUrl ?? null, user.id)
      : undefined;
  const avatarFallback = getInitials(user?.name ?? t("common.user"));

  return (
    <header
      className="sticky top-0 z-40 mx-auto w-full max-w-[430px] border-b border-white/5 bg-[linear-gradient(180deg,rgba(22,22,28,0.96)_0%,rgba(17,17,22,0.88)_100%)] shadow-[0_10px_26px_rgba(0,0,0,0.28)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(22,22,28,0.82)_0%,rgba(17,17,22,0.7)_100%)]"
      style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
    >
      <div className="grid h-14 grid-cols-[92px_1fr_92px] items-center gap-2 px-3">
        <div className="flex items-center justify-start">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-10 items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-3 text-[15px] font-medium text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:bg-white/[0.06] active:bg-white/[0.08]"
            >
              <ChevronLeft className="size-4.5 -ml-0.5" strokeWidth={2.6} />
              <span className="leading-none">{t("nav.back")}</span>
            </button>
          ) : null}
        </div>
        <h1 className="truncate px-2 text-center text-[18px] font-semibold tracking-[-0.035em] text-white/95">
          {displayTitle}
        </h1>
        <div className="flex items-center justify-end">
          <Link
            href="/profile"
            className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] shadow-[0_8px_24px_rgba(0,0,0,0.24)] ring-1 ring-black/20 transition-colors hover:bg-white/[0.08]"
            aria-label={t("nav.profile")}
          >
            <Avatar size="default" className="size-9">
              {avatarSrc ? <AvatarImage src={avatarSrc} alt={user?.name ?? t("nav.profile")} /> : null}
              <AvatarFallback className="bg-primary/20 text-[11px] font-semibold text-primary">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
