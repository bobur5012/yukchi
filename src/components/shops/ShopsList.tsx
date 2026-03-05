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
  Building2,
} from "lucide-react";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
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
  const { formatAmount } = useFormattedAmount();

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
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

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

  const totalDebt = filteredShops.reduce(
    (sum, shop) => sum + Number.parseFloat(shop.debt || "0"),
    0
  );
  const activeCount = filteredShops.filter((shop) => shop.status === "active").length;
  const filteredCount = filteredShops.length;

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteShop(deleteId);
      setShops((prev) => prev.filter((s) => s.id !== deleteId));
      setDeleteId(null);
      toast.success("Магазин удалён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка удаления");
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

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-border/40 bg-card/95 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.16)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[22px] font-semibold tracking-[-0.04em]">
              {t("titles.shops")}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t("shops.searchHint")}
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Store className="size-5" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/30 bg-background/50 p-3">
            <p className="text-[11px] text-muted-foreground">{t("shops.totalCount")}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums">{filteredCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="text-[11px] text-muted-foreground">{t("shops.activeCount")}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
            <p className="text-[11px] text-muted-foreground">{t("shops.debtTotal")}</p>
            <p className="mt-1 truncate text-[18px] font-semibold tabular-nums">
              {formatAmount(totalDebt)}
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("shops.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-2xl border-border/40 bg-background/60 pl-10"
          />
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
          estimateSize={180}
          gap={12}
          renderItem={(shop) => {
            const phoneDigits = shop.phone?.replace(/\D/g, "") || "";
            const telegramUrl = phoneDigits ? `https://t.me/+${phoneDigits}` : null;
            const telUrl = shop.phone ? `tel:${shop.phone}` : null;
            const statusLabel =
              shop.status === "active" ? t("couriers.active") : t("couriers.inactive");

            return (
              <div className="overflow-hidden rounded-[28px] border border-border/40 bg-card/95 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
                <Link href={`/shops/${shop.id}`} className="block p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-[18px] font-semibold tracking-[-0.03em]">
                            {shop.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4 shrink-0" />
                            <span className="truncate">{shop.ownerName}</span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                            statusColors[shop.status]
                          )}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Wallet className="size-3.5" />
                            <span>{t("shops.debt")}</span>
                          </div>
                          <p className="mt-1 truncate text-[18px] font-semibold tabular-nums">
                            {formatAmount(parseFloat(shop.debt || "0"))}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border/30 bg-background/45 p-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Phone className="size-3.5" />
                            <span>{t("common.phone")}</span>
                          </div>
                          <p className="mt-1 truncate text-[14px] font-medium">
                            {shop.phone || "—"}
                          </p>
                        </div>
                      </div>

                      {shop.address && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="line-clamp-2">{shop.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1 border-t border-border/30 px-4 py-3">
                  {telUrl && (
                    <Button variant="ghost" size="icon" className="size-10 rounded-xl" asChild>
                      <a href={telUrl}>
                        <Phone className="h-4 w-4 text-emerald-500" />
                      </a>
                    </Button>
                  )}
                  {telegramUrl && (
                    <Button variant="ghost" size="icon" className="size-10 rounded-xl" asChild>
                      <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 text-sky-500" />
                      </a>
                    </Button>
                  )}
                  <div className="flex-1" />
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
            <DialogTitle>Удалить магазин?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Магазин будет помечен как неактивный. Данные сохранятся.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Удаление…" : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
