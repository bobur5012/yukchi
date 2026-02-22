"use client";

import { useEffect, useState } from "react";
import { getTrips } from "@/lib/api/trips";
import { useAuthStore } from "@/stores/auth";
import type { Trip } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Wallet, TrendingUp, AlertTriangle } from "lucide-react";

export function TripsReport() {
  const user = useAuthStore((s) => s.user);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrips(1, 50).then((r) => setTrips(r.trips)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="rounded-2xl animate-pulse">
          <CardContent className="p-6 h-32" />
        </Card>
      </div>
    );
  }

  const activeTrips = trips.filter((t) => t.status === "active");
  const totalBudget = activeTrips.reduce((s, t) => s + parseFloat(t.budget || "0"), 0);
  const totalSpent = activeTrips.reduce(
    (s, t) => s + (t.expenses ?? []).reduce((e, x) => e + parseFloat(x.amount || "0"), 0),
    0
  );
  const totalRemaining = totalBudget - totalSpent;
  const overBudget = trips.filter((t) => {
    const spent = (t.expenses ?? []).reduce((s, e) => s + parseFloat(e.amount || "0"), 0);
    return parseFloat(t.budget || "0") - spent < 0;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Plane className="h-4 w-4" />
              <span className="text-sm">Активных поездок</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em]">{activeTrips.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Остаток бюджета</span>
            </div>
            <p
              className={`text-[20px] font-bold tabular-nums tracking-[-0.03em] ${
                totalRemaining < 0 ? "text-destructive" : ""
              }`}
            >
              {totalRemaining.toLocaleString()} $
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Сводка по бюджету</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Общий бюджет</span>
              <span>{totalBudget.toLocaleString()} $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Потрачено</span>
              <span>{totalSpent.toLocaleString()} $</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Остаток</span>
              <span className={totalRemaining < 0 ? "text-destructive" : ""}>
                {totalRemaining.toLocaleString()} $
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {overBudget.length > 0 && (
        <Card className="rounded-2xl border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Перерасход</h3>
            </div>
            <div className="space-y-2">
              {overBudget.map((t) => {
                const spent = (t.expenses ?? []).reduce((s, e) => s + parseFloat(e.amount || "0"), 0);
                const budgetNum = parseFloat(t.budget || "0");
                const over = spent - budgetNum;
                return (
                  <div
                    key={t.id}
                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                  >
                    <span className="truncate">{t.name}</span>
                    <Badge variant="destructive" className="shrink-0">
                      +{over.toLocaleString()} $
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Поездки по статусу</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              Активных: {trips.filter((t) => t.status === "active").length}
            </Badge>
            <Badge variant="secondary">
              Завершённых: {trips.filter((t) => t.status === "completed").length}
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-400">
              Запланировано: {trips.filter((t) => t.status === "planned").length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
