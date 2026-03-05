"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/lib/useTranslations";
import {
  LayoutDashboard,
  Plane,
  Store,
  Package,
  Users,
  User,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { QuickActionsSheet } from "@/components/layout/QuickActionsSheet";
import { useState } from "react";
import { motion } from "framer-motion";

const adminMainNavItems = (t: (k: string) => string) => [
  { href: "/dashboard", label: t("nav.home"), icon: LayoutDashboard },
  { href: "/trips",     label: t("nav.trips"), icon: Plane },
  { href: "/shops",     label: t("nav.shops"), icon: Store },
];

const courierMainNavItems = (t: (k: string) => string) => [
  { href: "/dashboard", label: t("nav.home"),     icon: LayoutDashboard },
  { href: "/trips",     label: t("nav.trips"),    icon: Plane },
  { href: "/shops",     label: t("nav.shops"),    icon: Store },
  { href: "/products",  label: t("nav.products"), icon: Package },
];

const adminMoreItems = (t: (k: string) => string) => [
  { href: "/products", label: t("nav.products"),    icon: Package },
  { href: "/couriers", label: t("nav.couriers"),   icon: Users },
  { href: "/profile",  label: t("nav.profile"),   icon: User },
];

function MoreSheet({ onNavigate, t }: { onNavigate: () => void; t: (k: string) => string }) {
  return (
    <SheetContent
      side="bottom"
      className="rounded-t-2xl border-t border-border/40 bg-card pb-safe"
    >
      <SheetHeader className="px-4 pt-4 pb-2">
        <SheetTitle className="text-[17px] font-semibold">{t("nav.more")}</SheetTitle>
      </SheetHeader>
      <div className="flex flex-col pb-6 pt-1">
        {adminMoreItems(t).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3.5 text-[16px] font-medium text-foreground
              hover:bg-accent transition-colors active:bg-accent/80"
          >
            <div className="size-9 rounded-[10px] bg-primary/15 flex items-center justify-center shrink-0">
              <Icon className="size-[18px] text-primary" />
            </div>
            {label}
          </Link>
        ))}
      </div>
    </SheetContent>
  );
}

function getFABHref(pathname: string, role: "admin" | "courier" | undefined): string | null {
  if (role === "admin") {
    if (pathname.startsWith("/trips"))    return "/trips/new";
    if (pathname.startsWith("/shops"))   return "/shops/new";
    if (pathname.startsWith("/products")) return "/products/new";
    if (pathname.startsWith("/couriers")) return "/couriers/new";
  }
  if (role === "courier") {
    if (pathname.startsWith("/trips"))    return "/trips/new";
    if (pathname.startsWith("/shops"))    return "/shops/new";
    if (pathname.startsWith("/products")) return "/products/new";
  }
  return null;
}

/* Single tab item — used for both left/right sides */
function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{ WebkitTapHighlightColor: "transparent" }}
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-1.5 transition-colors duration-150"
    >
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-2xl transition-all",
          active ? "bg-primary/16 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-muted-foreground/80"
        )}
      >
        <Icon
          className={cn(
            "size-[18px] shrink-0 transition-all",
            active ? "stroke-[2.3]" : "stroke-[1.9]"
          )}
        />
      </div>
      <span
        className={cn(
          "text-[10px] font-medium whitespace-nowrap tracking-[0.01em]",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const { t } = useTranslations();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const isAdmin = role === "admin";
  const mainNavItems = isAdmin ? adminMainNavItems(t) : courierMainNavItems(t);

  const isMoreActive =
    isAdmin &&
    adminMoreItems(t).some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );

  const isOnDashboard = pathname === "/dashboard";
  const fabHref = getFABHref(pathname, role ?? "admin");

  const leftItems  = mainNavItems.slice(0, 2);
  const rightItems = mainNavItems.slice(2);

  const fabButton = (
    <motion.div
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="relative flex flex-1 shrink-0 flex-col items-center justify-center"
    >
      <Button
        size="icon"
        className="z-10 size-[56px] -translate-y-4 rounded-full border border-white/10 bg-primary text-white shadow-[0_12px_34px_rgba(94,92,230,0.42)] ring-4 ring-background/80"
        onClick={isOnDashboard ? () => setQuickActionsOpen(true) : undefined}
        asChild={!isOnDashboard && !!fabHref}
      >
        {!isOnDashboard && fabHref ? (
          <Link href={fabHref}>
            <Plus className="size-6 stroke-[2.5]" />
          </Link>
        ) : (
          <Plus className="size-6 stroke-[2.5]" />
        )}
      </Button>
    </motion.div>
  );

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      className={cn(
        "fixed bottom-2 left-1/2 z-50 w-[calc(100%-12px)] max-w-[430px] -translate-x-1/2 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,22,28,0.95)_0%,rgba(14,14,18,0.9)_100%)] px-2 shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(22,22,28,0.8)_0%,rgba(14,14,18,0.72)_100%)]",
        "pb-[env(safe-area-inset-bottom,0)]"
      )}
    >
      <div className="mx-auto flex h-[60px] items-stretch justify-around gap-1">
        {leftItems.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href))
            }
          />
        ))}

        {/* Centre FAB */}
        {fabButton}

        {rightItems.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href))
            }
          />
        ))}

        {isAdmin && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-1.5"
              >
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-2xl transition-all",
                    isMoreActive ? "bg-primary/16 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-muted-foreground/80"
                  )}
                >
                  <MoreHorizontal
                    className={cn(
                      "size-[18px] shrink-0 transition-all",
                      isMoreActive ? "stroke-[2.3]" : "stroke-[1.9]"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium whitespace-nowrap tracking-[0.01em]",
                    isMoreActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t("nav.more")}
                </span>
              </button>
            </SheetTrigger>
            <MoreSheet onNavigate={() => setMoreOpen(false)} t={t} />
          </Sheet>
        )}
      </div>

      <QuickActionsSheet
        open={quickActionsOpen}
        onOpenChange={setQuickActionsOpen}
      />
    </motion.nav>
  );
}
