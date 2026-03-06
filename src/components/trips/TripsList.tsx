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
import {
  CalendarDays,
  ChevronRight,
  Pencil,
  Plane,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
        <DataErrorState message={error} onRetry={loadTrips} />
      </div>
    );
  }

  const activeTripsCount = trips.filter((trip) => trip.status === "active").length;
  const plannedTripsCount = trips.filter((trip) => trip.status === "planned").length;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(135deg,rgba(94,92,230,0.18)_0%,rgba(24,24,30,0.96)_42%,rgba(14,14,18,0.98)_100%)] px-5 py-5 shadow-[0_24px_48px_rgba(0,0,0,0.28)]">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08] text-primary">
            <Plane className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] font-semibold tracking-[-0.05em] text-foreground">
              {t("nav.trips")}
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
              Активные и запланированные поездки в более чистом Apple-like стиле.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Всего</p>
            <p className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">{trips.length}</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Активные</p>
            <p className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">{activeTripsCount}</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">План</p>
            <p className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">{plannedTripsCount}</p>
          </div>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
          <EmptyState
            icon={Plane}
            title={t("tripsDetail.noTrips")}
            description={t("tripsDetail.createFirst")}
          />
        </div>
      ) : (
        <VirtualList
          items={trips}
          estimateSize={250}
          gap={14}
          renderItem={(trip) => {
            const expenseItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type !== "income");
            const incomeItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type === "income");

            const spent = expenseItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
            const income = incomeItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
            const budgetUsd = parseFloat(trip.budgetUsd || trip.budget || "0");
            const oldDebt = parseFloat(trip.oldDebt || "0");
            const remaining = budgetUsd - spent - oldDebt + income;
            const couriers = trip.tripCouriers ?? [];
            const fundingLabel = oldDebt > 0 ? "Долг" : "Наличные";
            const statusTone =
              trip.status === "active"
                ? "border-emerald-500/24 bg-emerald-500/[0.04]"
                : trip.status === "completed"
                  ? "border-white/8 bg-white/[0.02]"
                  : "border-sky-500/20 bg-sky-500/[0.03]";

            return (
              <div
                className={`overflow-hidden rounded-[28px] border shadow-[0_18px_38px_rgba(0,0,0,0.18)] transition-transform active:scale-[0.992] ${statusTone}`}
              >
                <Link href={`/trips/${trip.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-[18px] border border-white/8 bg-white/[0.06] text-primary">
                          <Plane className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-[18px] font-semibold tracking-[-0.04em] leading-tight">
                            {trip.name}
                          </h3>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {trip.region?.name || "Turkey"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {formatDateSafe(trip.departureDate ?? "", "d MMMM yyyy", locale)}
                        {trip.returnDate && ` - ${formatDateSafe(trip.returnDate, "d MMM yyyy", locale)}`}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant="secondary" className={statusVariants[trip.status]}>
                        {t(`tripsDetail.${trip.status}`)}
                      </Badge>
                      <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[11px]">
                        {fundingLabel}
                      </Badge>
                      <ChevronRight className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                  </div>

                  {couriers.length > 0 ? (
                    <div className="mt-4 flex items-center gap-1.5">
                      <div className="flex -space-x-2">
                        {couriers.slice(0, 4).map((tc) => (
                          <Avatar key={tc.id} className="size-8 border-2 border-[#16161b]">
                            <AvatarImage src={getAvatarUrl(tc.courier?.avatarUrl)} alt={tc.courier?.name} />
                            <AvatarFallback className="bg-white/[0.08] text-[10px] font-semibold">
                              {tc.courier?.name?.slice(0, 2).toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {couriers.length > 4 ? (
                        <span className="text-xs text-muted-foreground">+{couriers.length - 4}</span>
                      ) : null}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {couriers.length} {t("tripsDetail.couriersCount")}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-3">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        {t("tripsDetail.budget")}
                      </p>
                      <p className="mt-1 text-[14px] font-semibold tabular-nums tracking-[-0.02em]">
                        ${budgetUsd.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-3">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        {t("tripsDetail.remaining")}
                      </p>
                      <p className={`mt-1 text-[14px] font-semibold tabular-nums tracking-[-0.02em] ${remaining < 0 ? "text-destructive" : "text-emerald-500"}`}>
                        ${remaining.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-orange-500/16 bg-orange-500/[0.08] p-3">
                      <p className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        <TrendingDown className="size-3.5" /> Расход
                      </p>
                      <p className="text-[14px] font-semibold tabular-nums text-orange-400">
                        ${spent.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-emerald-500/16 bg-emerald-500/[0.08] p-3">
                      <p className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        <TrendingUp className="size-3.5" /> Приход
                      </p>
                      <p className="text-[14px] font-semibold tabular-nums text-emerald-400">
                        +${income.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-2">
                    <div className="flex size-8 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Wallet className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        Финансирование
                      </p>
                      <p className="text-[13px] font-medium text-foreground">
                        {oldDebt > 0
                          ? `Старый долг: $${oldDebt.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}`
                          : "Без старого долга"}
                      </p>
                    </div>
                  </div>
                </Link>

                {isAdmin ? (
                  <div className="flex items-center justify-end gap-1 border-t border-white/6 px-4 pb-3 pt-2">
                    <Button variant="ghost" size="icon" className="size-9 rounded-2xl" asChild>
                      <Link href={`/trips/${trip.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteId(trip.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      )}

      {isAdmin ? (
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
      ) : null}
    </div>
  );
}
