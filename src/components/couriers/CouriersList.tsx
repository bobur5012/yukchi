"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCouriers } from "@/lib/api/couriers";
import type { Courier } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Users } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/ui/virtual-list";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function CouriersList() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCouriers()
      .then(setCouriers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  if (couriers.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <EmptyState
          icon={Users}
          title="Нет курьеров"
          description="Добавьте первого курьера"
        />
      </div>
    );
  }

  return (
    <VirtualList
      items={couriers}
      estimateSize={100}
      gap={16}
      renderItem={(courier) => (
        <div className="rounded-2xl border border-border/50 bg-card p-4 card-premium">
          <div className="flex gap-4 items-start">
            <Avatar className="h-12 w-12 shrink-0">
              {courier.avatarUrl ? (
                <AvatarImage src={courier.avatarUrl} alt={courier.name} />
              ) : null}
              <AvatarFallback className="text-sm">
                {getInitials(courier.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{courier.name}</h3>
              <p className="text-sm text-muted-foreground">{courier.phone}</p>
              <div className="flex gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={
                    courier.status === "active"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-muted"
                  }
                >
                  {courier.status === "active" ? "Активен" : "Неактивен"}
                </Badge>
                {"activeTripsCount" in courier && typeof (courier as { activeTripsCount?: number }).activeTripsCount === "number" ? (
                  <span className="text-sm text-muted-foreground">
                    {(courier as { activeTripsCount: number }).activeTripsCount} поездок
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {"totalTurnover" in courier && typeof (courier as { totalTurnover?: number }).totalTurnover === "number" ? (
                <p className="font-semibold">
                  {(courier as { totalTurnover: number }).totalTurnover.toLocaleString()} $
                </p>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                className="min-w-[44px] min-h-[44px]"
                asChild
              >
                <Link href={`/couriers/${courier.id}/edit`}>
                  <Pencil className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    />
  );
}
