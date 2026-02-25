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
  { href: "/profile",   label: t("nav.profile"),  icon: User },
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
      className="relative flex flex-col items-center justify-center flex-1 pt-2 pb-1 gap-[3px]
        min-w-0 transition-colors duration-150 -webkit-tap-highlight-color-transparent"
    >
      <Icon
        className={cn(
          "size-6 shrink-0 transition-all",
          active ? "text-primary stroke-[2]" : "text-muted-foreground stroke-[1.5]"
        )}
      />
      <span
        className={cn(
          "text-[10px] font-medium whitespace-nowrap tracking-[0.01em]",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-primary"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
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
      className="relative flex flex-col items-center justify-center flex-1 shrink-0"
    >
      <Button
        size="icon"
        className="size-[54px] rounded-full bg-primary text-white
          shadow-[0_4px_20px_rgba(94,92,230,0.45)] -translate-y-3 z-10"
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
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border/40",
        "bg-card/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/80",
        "pb-[env(safe-area-inset-bottom,0)]"
      )}
    >
      <div className="flex items-stretch justify-around h-[56px] max-w-[520px] mx-auto px-1">
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
                className="relative flex flex-col items-center justify-center flex-1 pt-2 pb-1 gap-[3px]
                  min-w-0 -webkit-tap-highlight-color-transparent"
              >
                {isMoreActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <MoreHorizontal
                  className={cn(
                    "size-6 shrink-0 transition-all",
                    isMoreActive ? "text-primary stroke-[2]" : "text-muted-foreground stroke-[1.5]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium whitespace-nowrap tracking-[0.01em]",
                    isMoreActive ? "text-primary" : "text-muted-foreground"
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
