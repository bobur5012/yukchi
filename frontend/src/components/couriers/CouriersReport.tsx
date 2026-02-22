"use client";

import { useEffect, useState } from "react";
import { getCouriers } from "@/lib/api/couriers";
import type { Courier } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Plane } from "lucide-react";
import Link from "next/link";

export function CouriersReport() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCouriers().then(setCouriers).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  type CourierWithStats = Courier & { totalTurnover?: number; activeTripsCount?: number };
  const totalTurnover = couriers.reduce((s, c) => s + ((c as CourierWithStats).totalTurnover ?? 0), 0);
  const activeCount = couriers.filter((c) => c.status === "active").length;
  const sortedByTurnover = [...couriers].sort(
    (a, b) => ((b as CourierWithStats).totalTurnover ?? 0) - ((a as CourierWithStats).totalTurnover ?? 0)
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card p-4 card-premium">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Активных курьеров</span>
          </div>
          <p className="text-[22px] font-bold tabular-nums tracking-[-0.03em]">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-4 card-premium">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Общий оборот</span>
          </div>
          <p className="text-[22px] font-bold tabular-nums tracking-[-0.03em]">
            {totalTurnover.toLocaleString()} $
          </p>
        </div>
      </div>

      <Card className="rounded-2xl card-premium">
        <CardContent className="p-4">
          <h3 className="section-title mb-3">Оборот по курьерам</h3>
          <div className="space-y-2">
            {sortedByTurnover.map((c, i) => (
              <Link key={c.id} href={`/couriers/${c.id}/edit`}>
                <div className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-6">
                      {i + 1}.
                    </span>
                    <p className="font-medium">{c.name}</p>
                    {c.status === "active" && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs"
                      >
                        Активен
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold">
                    {((c as CourierWithStats).totalTurnover ?? 0).toLocaleString()} $
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl card-premium">
        <CardContent className="p-4">
          <h3 className="section-title mb-3">Активные поездки</h3>
          <div className="space-y-2">
            {couriers
              .filter((c) => ((c as CourierWithStats).activeTripsCount ?? 0) > 0)
              .map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {(c as CourierWithStats).activeTripsCount ?? 0} поездок
                  </Badge>
                </div>
              ))}
            {couriers.every((c) => ((c as CourierWithStats).activeTripsCount ?? 0) === 0) && (
              <p className="text-sm text-muted-foreground py-2">
                Нет активных поездок
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
