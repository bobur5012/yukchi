"use client";

import { useEffect, useState } from "react";
import { getTrips } from "@/lib/api/trips";
import type { Trip } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Wallet, TrendingUp, AlertTriangle, TrendingDown } from "lucide-react";

export function TripsReport() {
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

  const totals = activeTrips.reduce(
    (acc, trip) => {
      const budget = parseFloat(trip.budgetUsd || trip.budget || "0");
      const oldDebt = parseFloat(trip.oldDebt || "0");
      const expenseItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type !== "income");
      const incomeItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type === "income");
      const spent = expenseItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
      const income = incomeItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);

      acc.totalBudget += budget;
      acc.totalOldDebt += oldDebt;
      acc.totalSpent += spent;
      acc.totalIncome += income;
      return acc;
    },
    { totalBudget: 0, totalOldDebt: 0, totalSpent: 0, totalIncome: 0 }
  );

  const totalRemaining = totals.totalBudget - totals.totalOldDebt - totals.totalSpent + totals.totalIncome;
  const overBudget = trips.filter((trip) => {
    const budget = parseFloat(trip.budgetUsd || trip.budget || "0");
    const oldDebt = parseFloat(trip.oldDebt || "0");
    const expenseItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type !== "income");
    const incomeItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type === "income");
    const spent = expenseItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
    const income = incomeItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
    const remaining = budget - oldDebt - spent + income;
    return remaining < 0;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Plane className="h-4 w-4" />
              <span className="text-sm">Активные поездки</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em]">{activeTrips.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Остаток бюджета</span>
            </div>
            <p className={`text-[20px] font-bold tabular-nums tracking-[-0.03em] ${totalRemaining < 0 ? "text-destructive" : "text-emerald-500"}`}>
              {totalRemaining.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Общий расход</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em] text-orange-500">
              {totals.totalSpent.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Общий приход</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em] text-emerald-500">
              +{totals.totalIncome.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Сводка по бюджету</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Общий бюджет</span>
              <span>{totals.totalBudget.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Старый долг</span>
              <span>{totals.totalOldDebt.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Потрачено</span>
              <span className="text-orange-500">{totals.totalSpent.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Приход</span>
              <span className="text-emerald-500">+{totals.totalIncome.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $</span>
            </div>
            <div className="flex justify-between font-medium border-t border-border/50 pt-2">
              <span>Остаток</span>
              <span className={totalRemaining < 0 ? "text-destructive" : "text-emerald-500"}>
                {totalRemaining.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $
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
              <h3 className="font-semibold">Поездки с минусовым остатком</h3>
            </div>
            <div className="space-y-2">
              {overBudget.map((trip) => {
                const budget = parseFloat(trip.budgetUsd || trip.budget || "0");
                const oldDebt = parseFloat(trip.oldDebt || "0");
                const expenseItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type !== "income");
                const incomeItems = (trip.expenses ?? []).filter((e) => (e as { type?: string }).type === "income");
                const spent = expenseItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
                const income = incomeItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
                const deficit = Math.abs(budget - oldDebt - spent + income);

                return (
                  <div key={trip.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="truncate">{trip.name}</span>
                    <Badge variant="destructive" className="shrink-0">
                      -{deficit.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} $
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
