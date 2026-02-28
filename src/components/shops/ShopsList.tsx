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

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "Активен",
  inactive: "Неактивен",
};

export function ShopsList() {
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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию, владельцу, телефону, адресу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 rounded-xl bg-muted/50 border-border/50"
        />
      </div>

      {filteredShops.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <EmptyState
            icon={Store}
            title={search ? "Ничего не найдено" : "Нет магазинов"}
            description={search ? "Попробуйте другой запрос" : "Добавьте первый магазин"}
          />
        </div>
      ) : (
        <VirtualList
          items={filteredShops}
          estimateSize={140}
          gap={12}
          renderItem={(shop) => {
            const phoneDigits = shop.phone?.replace(/\D/g, "") || "";
            const telegramUrl = phoneDigits ? `https://t.me/+${phoneDigits}` : null;
            const telUrl = shop.phone ? `tel:${shop.phone}` : null;

            return (
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden card-premium">
                <Link href={`/shops/${shop.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[17px] truncate">{shop.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                        <User className="h-4 w-4 shrink-0" />
                        <span className="truncate">{shop.ownerName}</span>
                      </div>
                      {shop.address && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">{shop.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium",
                            statusColors[shop.status]
                          )}
                        >
                          {statusLabels[shop.status]}
                        </span>
                        <span className="font-semibold text-[16px] tabular-nums text-primary">
                          {formatAmount(parseFloat(shop.debt || "0"))}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Actions row */}
                <div className="flex items-center gap-1 px-4 pb-4 pt-0">
                  {telUrl && (
                    <Button variant="ghost" size="icon" className="size-9 rounded-xl" asChild>
                      <a href={telUrl}>
                        <Phone className="h-4 w-4 text-emerald-500" />
                      </a>
                    </Button>
                  )}
                  {telegramUrl && (
                    <Button variant="ghost" size="icon" className="size-9 rounded-xl" asChild>
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
                        className="size-9 rounded-xl"
                        asChild
                      >
                        <Link href={`/shops/${shop.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
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
