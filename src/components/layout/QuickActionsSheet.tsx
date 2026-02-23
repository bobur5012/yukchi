"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/useTranslations";
import { Plane, Wallet, CreditCard, Package, ArrowLeft, Store } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { getShops } from "@/lib/api/shops";
import type { Shop } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

interface QuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionsSheet({ open, onOpenChange }: QuickActionsSheetProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const [shops, setShops] = useState<Shop[]>([]);
  const [view, setView] = useState<"actions" | "shops">("actions");

  useEffect(() => {
    if (open && role === "admin") {
      getShops(1, 100).then((r) => setShops(r.shops));
    }
  }, [open, role]);

  const handleClose = () => {
    setView("actions");
    onOpenChange(false);
  };

  const handlePayment = (shopId: string) => {
    router.push(`/shops/${shopId}/payments/new`);
    handleClose();
  };

  const isAdmin = role === "admin";

  const actionItems = [
    {
      label: t("quickActions.newTrip"),
      href: "/trips/new",
      icon: Plane,
    },
    ...(isAdmin
      ? [
          { label: t("quickActions.addDebt"), href: "/shops/new", icon: Wallet },
          {
            label: t("quickActions.makePayment"),
            icon: CreditCard,
            hasSubmenu: true,
          },
        ]
      : []),
    ...(role === "courier"
      ? [{ label: t("quickActions.addProduct"), href: "/products/new", icon: Package }]
      : []),
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t border-border/50 pb-8"
        showCloseButton
      >
        <SheetHeader className="pb-2">
          {view === "shops" ? (
            <button
              type="button"
              onClick={() => setView("actions")}
              className="flex items-center gap-2 text-left text-lg font-semibold text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              {t("shops.selectShop")}
            </button>
          ) : (
            <SheetTitle className="text-lg font-semibold">
              {t("quickActions.title")}
            </SheetTitle>
          )}
        </SheetHeader>

        <AnimatePresence mode="wait">
          {view === "actions" ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-1 pt-2"
            >
              {actionItems.map((item) => {
                if ("hasSubmenu" in item && item.hasSubmenu) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setView("shops")}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted/60 active:bg-muted transition-colors w-full text-left"
                    >
                      <item.icon className="h-5 w-5 text-primary shrink-0" />
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={(item as { href: string }).href}
                    onClick={handleClose}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted/60 active:bg-muted transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-primary shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="shops"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-1 pt-2 max-h-[60vh] overflow-y-auto"
            >
              {shops.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  {t("shops.noShops")}
                </p>
              ) : (
                shops.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => handlePayment(shop.id)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted/60 active:bg-muted transition-colors w-full text-left"
                  >
                    <Store className="h-5 w-5 text-primary shrink-0" />
                    <span className="truncate">{shop.name}</span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
