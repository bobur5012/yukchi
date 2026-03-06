"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { getShops, deleteShop } from "@/lib/api/shops";
import type { Shop } from "@/types";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Store,
  Phone,
  MapPin,
  Search,
  Pencil,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/ui/virtual-list";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/useTranslations";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
};

export function ShopsList() {
  const { t } = useTranslations();
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadShops = useCallback(() => {
    setLoading(true);
    setError(null);
    getShops(1, 100)
      .then((r) => setShops(r.shops))
      .catch((e) => setError(e instanceof Error ? e.message : t("common.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const filteredShops = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ownerName?.toLowerCase().includes(q) ||
        s.phone?.includes(search.trim()) ||
        s.address?.toLowerCase().includes(q)
    );
  }, [shops, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteShop(deleteId);
      setShops((prev) => prev.filter((s) => s.id !== deleteId));
      setDeleteId(null);
      toast.success(t("shops.deleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("shops.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <DataErrorState message={error} onRetry={loadShops} />
      </div>
    );
  }

  const totalDebt = filteredShops.reduce((sum, shop) => sum + Number.parseFloat(shop.debt || "0"), 0);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(135deg,rgba(94,92,230,0.18)_0%,rgba(24,24,30,0.96)_42%,rgba(14,14,18,0.98)_100%)] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[20px] font-semibold tracking-[-0.04em]">
              {t("titles.shops")}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {t("shops.searchHint")}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-primary">
            <Store className="size-4.5" />
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("shops.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-2xl border-white/10 bg-white/[0.04] pl-10"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{t("shops.totalCount")}</p>
            <p className="mt-1 text-[15px] font-semibold tracking-[-0.03em]">{filteredShops.length}</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{t("shops.activeCount")}</p>
            <p className="mt-1 text-[15px] font-semibold tracking-[-0.03em]">
              {filteredShops.filter((shop) => shop.status === "active").length}
            </p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{t("shops.debtTotal")}</p>
            <p className="mt-1 truncate text-[15px] font-semibold tracking-[-0.03em]">
              {totalDebt.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $
            </p>
          </div>
        </div>
      </div>

      {filteredShops.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <EmptyState
            icon={Store}
            title={search ? t("shops.emptyFilteredTitle") : t("shops.noShops")}
            description={search ? t("shops.emptyFilteredDescription") : t("shops.emptyDescription")}
          />
        </div>
      ) : (
        <VirtualList
          items={filteredShops}
          estimateSize={136}
          gap={12}
          renderItem={(shop) => {
            const phoneDigits = shop.phone?.replace(/\D/g, "") || "";
            const telegramUrl = phoneDigits ? `https://t.me/+${phoneDigits}` : null;
            const telUrl = shop.phone ? `tel:${shop.phone}` : null;
            const statusLabel =
              shop.status === "active" ? t("couriers.active") : t("couriers.inactive");

            return (
              <div className="overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(28,28,34,0.96)_0%,rgba(20,20,26,0.92)_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.18)]">
                <Link href={`/shops/${shop.id}`} className="block p-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.06] text-primary">
                      <Store className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-semibold tracking-[-0.03em]">
                            {shop.name}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{shop.ownerName}</span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-1 text-[11px] font-medium",
                            statusColors[shop.status]
                          )}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="min-w-0 rounded-[18px] border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Wallet className="size-3" />
                            <span>{t("shops.debt")}</span>
                          </div>
                          <p className="mt-0.5 truncate text-[14px] font-semibold tabular-nums">
                            {Number.parseFloat(shop.debt || "0").toLocaleString("ru-RU", {
                              maximumFractionDigits: 2,
                            })} USD
                          </p>
                        </div>
                        {shop.address ? (
                          <div className="min-w-0 flex-1 text-right text-[10px] text-muted-foreground">
                            <div className="inline-flex items-center gap-1.5">
                              <MapPin className="size-3 shrink-0" />
                              <span className="line-clamp-1">{shop.address}</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 border-t border-border/30 px-2.5 py-2">
                  {telUrl ? (
                    <Button variant="secondary" className="h-10 flex-1 rounded-2xl justify-center gap-2 bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/18" asChild>
                      <a href={telUrl}>
                        <Phone className="h-4.5 w-4.5" />
                        {t("shops.callAction")}
                      </a>
                    </Button>
                  ) : null}
                  {telegramUrl ? (
                    <Button variant="secondary" className="h-10 flex-1 rounded-2xl justify-center gap-2 bg-sky-500/12 text-sky-400 hover:bg-sky-500/18" asChild>
                      <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4.5 w-4.5" />
                        {t("shops.telegramAction")}
                      </a>
                    </Button>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 rounded-xl"
                        asChild
                      >
                        <Link href={`/shops/${shop.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(shop.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("shops.deleteTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("shops.deleteDescription")}
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("shops.deleting") : t("shops.deleteAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
