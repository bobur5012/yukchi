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
import { ChevronRight, Plane, Pencil, Trash2 } from "lucide-react";
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
          estimateSize={160}
          gap={16}
          renderItem={(trip) => {
            const spent = (trip.expenses ?? []).reduce((s, e) => s + parseFloat(e.amount || "0"), 0);
            const oldDebt = parseFloat(trip.oldDebt || "0");
            const budgetNum = parseFloat(trip.budget || "0");
            const remaining = budgetNum - spent - oldDebt;
            const statusBorder =
              trip.status === "active"
                ? "border-l-4 border-l-emerald-500"
                : trip.status === "completed"
                  ? "border-l-4 border-l-muted-foreground/40"
                  : "border-l-4 border-l-blue-500";
            return (
              <div
                className={`rounded-2xl border border-border/50 bg-card overflow-hidden card-premium ${statusBorder}`}
              >
                <Link href={`/trips/${trip.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg truncate">
                        {trip.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatDateSafe(trip.departureDate ?? "", "d MMMM yyyy", locale)}
                        {trip.returnDate && ` — ${formatDateSafe(trip.returnDate, "d MMM yyyy", locale)}`}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className={statusVariants[trip.status]}
                        >
                          {t(`tripsDetail.${trip.status}`)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(trip.tripCouriers ?? []).length} {t("tripsDetail.couriersCount")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("tripsDetail.budget")}:</span>
                    <span>{trip.budget} {trip.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">{t("tripsDetail.remaining")}:</span>
                    <span
                      className={
                        remaining < 0 ? "text-destructive font-medium" : ""
                      }
                    >
                      {remaining} {trip.currency}
                    </span>
                  </div>
                </Link>
                {isAdmin && (
                  <div className="flex items-center gap-1 px-4 pb-4 pt-0">
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" className="size-9 rounded-xl" asChild>
                      <Link href={`/trips/${trip.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
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
                {deleting ? "Удаление…" : "Удалить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
