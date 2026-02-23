"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrips } from "@/lib/api/trips";
import { useAuthStore } from "@/stores/auth";
import type { Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDateSafe } from "@/lib/date-utils";
import { useTranslations } from "@/lib/useTranslations";
import { ChevronRight, Plane } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/ui/virtual-list";


const statusVariants: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  completed: "bg-muted text-muted-foreground",
  planned: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
};

export function TripsList() {
  const { t, locale } = useTranslations();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    getTrips(1, 50)
      .then((r) => setTrips(r.trips))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ListSkeleton count={4} />;
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
              <Link href={`/trips/${trip.id}`}>
                <div
                  className={`rounded-2xl border border-border/50 bg-card p-4 card-premium ${statusBorder}`}
                >
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
                    <span className="text-muted-foreground">Остаток:</span>
                    <span
                      className={
                        remaining < 0 ? "text-destructive font-medium" : ""
                      }
                    >
                      {remaining} {trip.currency}
                    </span>
                  </div>
                </div>
              </Link>
            );
          }}
        />
      )}
    </div>
  );
}
