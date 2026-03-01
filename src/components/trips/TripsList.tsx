"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getTrips, deleteTrip } from "@/lib/api/trips";
import { useAuthStore } from "@/stores/auth";
import type { Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateSafe } from "@/lib/date-utils";
import { useTranslations } from "@/lib/useTranslations";
import { ChevronRight, Plane, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";
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

const statusVariants: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  completed: "bg-muted text-muted-foreground",
  planned: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
};

export function TripsList() {
  const { t, locale } = useTranslations();
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTrips = useCallback(() => {
    setLoading(true);
    setError(null);
    getTrips(1, 50)
      .then((r) => setTrips(r.trips))
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTrip(deleteId);
      setTrips((prev) => prev.filter((tr) => tr.id !== deleteId));
      setDeleteId(null);
      toast.success("Поездка удалена");
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
        <DataErrorState message={error} onRetry={loadTrips} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <EmptyState
            icon={Plane}
            title={t("tripsDetail.noTrips")}
            description={t("tripsDetail.createFirst")}
          />
        </div>
      ) : (
        <VirtualList
          items={trips}
          estimateSize={172}
          gap={16}
          renderItem={(trip) => {
            const expenseItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type !== "income");
            const incomeItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type === "income");

            const spent = expenseItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
            const income = incomeItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
            const budgetUsd = parseFloat(trip.budgetUsd || trip.budget || "0");
            const oldDebt = parseFloat(trip.oldDebt || "0");
            const remaining = budgetUsd - spent - oldDebt + income;
            const couriers = trip.tripCouriers ?? [];
            const fundingLabel = oldDebt > 0 ? "Долг" : "Наличка";

            const statusBorder =
              trip.status === "active"
                ? "border-l-4 border-l-emerald-500"
                : trip.status === "completed"
                  ? "border-l-4 border-l-muted-foreground/40"
                  : "border-l-4 border-l-blue-500";

            return (
              <div className={`rounded-2xl border border-border/60 bg-card/95 overflow-hidden card-premium shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)] ${statusBorder}`}>
                <Link href={`/trips/${trip.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg truncate leading-tight">{trip.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatDateSafe(trip.departureDate ?? "", "d MMMM yyyy", locale)}
                        {trip.returnDate && ` - ${formatDateSafe(trip.returnDate, "d MMM yyyy", locale)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={statusVariants[trip.status]}>
                        {t(`tripsDetail.${trip.status}`)}
                      </Badge>
                      <Badge variant="outline" className="border-border/60 text-xs">
                        {fundingLabel}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  {couriers.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3">
                      <div className="flex -space-x-2">
                        {couriers.slice(0, 4).map((tc) => (
                          <Avatar key={tc.id} className="size-7 border-2 border-card">
                            <AvatarImage src={getAvatarUrl(tc.courier?.avatarUrl)} alt={tc.courier?.name} />
                            <AvatarFallback className="text-[10px] font-semibold bg-muted">
                              {tc.courier?.name?.slice(0, 2).toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {couriers.length > 4 && <span className="text-xs text-muted-foreground">+{couriers.length - 4}</span>}
                      <span className="text-xs text-muted-foreground ml-1">
                        {couriers.length} {t("tripsDetail.couriersCount")}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <p className="text-[11px] text-muted-foreground mb-0.5">{t("tripsDetail.budget")}</p>
                      <p className="text-[13px] font-semibold tabular-nums">
                        ${budgetUsd.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-center border-x border-border/40">
                      <p className="text-[11px] text-muted-foreground mb-0.5 flex items-center justify-center gap-0.5">
                        <TrendingDown className="size-3" /> Расход
                      </p>
                      <p className="text-[13px] font-semibold tabular-nums text-orange-500">
                        ${spent.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-muted-foreground mb-0.5 flex items-center justify-center gap-0.5">
                        <TrendingUp className="size-3" /> Приход
                      </p>
                      <p className="text-[13px] font-semibold tabular-nums text-emerald-500">
                        +${income.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-muted-foreground mb-0.5">{t("tripsDetail.remaining")}</p>
                      <p className={`text-[13px] font-semibold tabular-nums ${remaining < 0 ? "text-destructive" : "text-emerald-500"}`}>
                        ${remaining.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </Link>

                {isAdmin && (
                  <div className="flex items-center justify-end gap-1 px-4 pb-3 -mt-1">
                    <Button variant="ghost" size="icon" className="size-8 rounded-xl" asChild>
                      <Link href={`/trips/${trip.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteId(trip.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          }}
        />
      )}

      {isAdmin && (
        <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Удалить поездку?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Поездка и все связанные данные будут удалены безвозвратно.
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Удаление..." : "Удалить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
