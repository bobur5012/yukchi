"use client";

import { useEffect, useState } from "react";
import { getTrips } from "@/lib/api/trips";
import { getProductsByTrips } from "@/lib/api/products";
import type { Trip, Product, Expense } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plane, Wallet, TrendingUp, AlertTriangle, TrendingDown, Package, Receipt, Calendar } from "lucide-react";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import { getLocalDateInputValue } from "@/lib/date-utils";

function toNum(v?: string | null): number {
  return Number.parseFloat(v || "0") || 0;
}

function isSameDay(a: string, b: string): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function TripsReport() {
  const { formatAmount } = useFormattedAmount();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getLocalDateInputValue());

  useEffect(() => {
    setLoading(true);
    getTrips(1, 50)
      .then(async (r) => {
        setTrips(r.trips);
        const ids = r.trips.map((t) => t.id);
        const prods = await getProductsByTrips(ids);
        setProducts(prods);
      })
      .finally(() => setLoading(false));
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

  const dayProducts = products.filter((p) => p.createdAt && isSameDay(p.createdAt, selectedDate));
  const dayExpenses: { trip: Trip; expense: Expense }[] = [];
  const dayIncomes: { trip: Trip; expense: Expense }[] = [];
  for (const trip of trips) {
    for (const e of trip.expenses ?? []) {
      if (e.createdAt && isSameDay(e.createdAt, selectedDate)) {
        const exp = e as Expense & { type?: string };
        if (exp.type === "income") dayIncomes.push({ trip, expense: e });
        else dayExpenses.push({ trip, expense: e });
      }
    }
  }
  const dayProductsTotal = dayProducts.reduce((s, p) => {
    const sale = toNum(p.salePrice ?? p.salePriceUsd) * p.quantity;
    const del = toNum(p.pricePerKg ?? p.pricePerKgUsd) > 0
      ? toNum(p.pricePerKg ?? p.pricePerKgUsd) * p.quantity
      : toNum(p.costPrice ?? p.costPriceUsd);
    return s + sale + del;
  }, 0);
  const dayExpensesTotal = dayExpenses.reduce((s, { expense }) => s + toNum(expense.amountUsd ?? expense.amount), 0);
  const dayIncomesTotal = dayIncomes.reduce((s, { expense }) => s + toNum(expense.amountUsd ?? expense.amount), 0);

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
      <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Отчёт за день</span>
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-11 rounded-xl"
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Активность за {selectedDate}</h3>
          <div className="grid gap-3 grid-cols-3 mb-4">
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Товары</p>
              <p className="text-lg font-bold tabular-nums text-emerald-600">{dayProducts.length}</p>
              <p className="text-xs tabular-nums">{formatAmount(dayProductsTotal)}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <Receipt className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Расходы</p>
              <p className="text-lg font-bold tabular-nums text-orange-500">{dayExpenses.length}</p>
              <p className="text-xs tabular-nums">{formatAmount(dayExpensesTotal)}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Приходы</p>
              <p className="text-lg font-bold tabular-nums text-emerald-600">{dayIncomes.length}</p>
              <p className="text-xs tabular-nums">+{formatAmount(dayIncomesTotal)}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {dayProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Добавленные товары</p>
                <div className="space-y-1">
                  {dayProducts.map((p) => {
                    const trip = trips.find((t) => t.id === p.tripId);
                    const total = toNum(p.salePrice ?? p.salePriceUsd) * p.quantity +
                      (toNum(p.pricePerKg ?? p.pricePerKgUsd) > 0
                        ? toNum(p.pricePerKg ?? p.pricePerKgUsd) * p.quantity
                        : toNum(p.costPrice ?? p.costPriceUsd));
                    return (
                      <div key={p.id} className="flex justify-between py-1.5 px-2 rounded-lg bg-muted/20">
                        <span className="truncate">{p.name}</span>
                        <span className="shrink-0 tabular-nums">{trip?.name} — {formatAmount(total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {dayExpenses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Расходы</p>
                <div className="space-y-1">
                  {dayExpenses.map(({ trip, expense }) => (
                    <div key={expense.id} className="flex justify-between py-1.5 px-2 rounded-lg bg-muted/20">
                      <span className="truncate">{(expense as Expense & { description?: string }).description || "Расход"}</span>
                      <span className="shrink-0 tabular-nums text-orange-500">{trip.name} — {formatAmount(toNum(expense.amountUsd ?? expense.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dayIncomes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Приходы</p>
                <div className="space-y-1">
                  {dayIncomes.map(({ trip, expense }) => (
                    <div key={expense.id} className="flex justify-between py-1.5 px-2 rounded-lg bg-muted/20">
                      <span className="truncate">{(expense as Expense & { description?: string }).description || "Приход"}</span>
                      <span className="shrink-0 tabular-nums text-emerald-600">+{formatAmount(toNum(expense.amountUsd ?? expense.amount))} — {trip.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dayProducts.length === 0 && dayExpenses.length === 0 && dayIncomes.length === 0 && (
              <p className="text-muted-foreground py-4 text-center">Нет активности за выбранный день</p>
            )}
          </div>
        </CardContent>
      </Card>

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
