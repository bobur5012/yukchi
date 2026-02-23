"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";

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

export function Header({ title }: HeaderProps) {
  const { t } = useTranslations();
  const router   = useRouter();
  const pathname = usePathname();
  const titleKey = getTitleKey(pathname);
  const displayTitle = title ?? (titleKey.startsWith("titles.") || titleKey.startsWith("nav.") ? t(titleKey) : titleKey);
  const showBack     = shouldShowBack(pathname);
  const backHref     = getBackHref(pathname);

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header
      className="sticky top-0 z-40 w-full max-w-[430px] mx-auto
        bg-card/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/75
        border-b border-border/30"
      style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
    >
      <div className="flex h-12 items-center px-2 gap-1">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-0.5 text-primary font-medium
              px-2 h-9 rounded-[10px] hover:bg-accent active:bg-accent/80
              transition-colors shrink-0 text-[16px]"
          >
            <ChevronLeft className="size-5 -ml-1" strokeWidth={2.5} />
            <span className="leading-none">{t("nav.back")}</span>
          </button>
        )}
        <h1 className="flex-1 text-[17px] font-semibold truncate tracking-[-0.02em] text-center px-2">
          {displayTitle}
        </h1>
        {/* Right spacer to keep title visually centered */}
        {showBack && <div className="w-[70px] shrink-0" />}
      </div>
    </header>
  );
}
