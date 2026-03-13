"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getTrip } from "@/lib/api/trips";
import { getProducts } from "@/lib/api/products";
import { formatDateSafe } from "@/lib/date-utils";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import { useTranslations } from "@/lib/useTranslations";
import { useAuthStore } from "@/stores/auth";
import type { Trip, Product, Expense } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Receipt,
  Package,
  Store,
  ArrowDownCircle,
  ArrowUpCircle,
  Plane,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProductCoverImageUrl } from "@/lib/product-media";
import { getAvatarUrl } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { ExpenseDetailSheet } from "./ExpenseDetailSheet";
import { ProductDetailSheet } from "./ProductDetailSheet";
import { VirtualList } from "@/components/ui/virtual-list";
import { getLocalizedProductUnit } from "@/lib/product-units";

interface TripDetailProps {
  tripId: string;
}

export function TripDetail({ tripId }: TripDetailProps) {
  const { t, locale } = useTranslations();
  const { formatAmount } = useFormattedAmount();
  const role = useAuthStore((s) => s.user?.role);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenseDetail, setExpenseDetail] = useState<Expense | null>(null);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTrip(tripId),
      getProducts(tripId),
    ])
      .then(([tripData, productsData]) => {
        setTrip(tripData ?? null);
        setProducts(productsData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("common.loadError")))
      .finally(() => setLoading(false));
  }, [t, tripId]);

  useEffect(() => {
    Promise.all([
      getTrip(tripId),
      getProducts(tripId),
    ])
      .then(([tripData, productsData]) => {
        setTrip(tripData ?? null);
        setProducts(productsData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("common.loadError")))
      .finally(() => setLoading(false));
  }, [t, tripId]);

  if (loading) {
    return <ListSkeleton count={3} />;
  }

  if (error) {
    return <DataErrorState message={error} onRetry={load} />;
  }

  if (!trip) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("tripsDetail.notFound")}
      </div>
    );
  }

  const expenses = trip.expenses ?? [];
  const expenseItems = expenses.filter((e) => (e as Expense & { type?: string }).type !== "income");
  const incomeItems = expenses.filter((e) => (e as Expense & { type?: string }).type === "income");
  const spent = expenseItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
  const income = incomeItems.reduce((s, e) => s + parseFloat(e.amountUsd || e.amount || "0"), 0);
  const budget = parseFloat(trip.budgetUsd || trip.budget || "0");
  const oldDebt = parseFloat(trip.oldDebt || "0");
  const remaining = budget - oldDebt - spent + income;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(135deg,rgba(94,92,230,0.18)_0%,rgba(24,24,30,0.96)_42%,rgba(14,14,18,0.98)_100%)] shadow-[0_24px_48px_rgba(0,0,0,0.28)]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08] text-primary">
              <Plane className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {t(`tripsDetail.${trip.status}`)}
              </p>
              <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.05em]">{trip.name}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[12px] text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {formatDateSafe(trip.departureDate ?? "", "d MMMM yyyy", locale)}
                  {trip.returnDate && ` - ${formatDateSafe(trip.returnDate, "d MMM yyyy", locale)}`}
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[12px] text-muted-foreground">
                  <Wallet className="size-3.5" />
                  {oldDebt > 0 ? t("trips.debtShort") : t("trips.cashShort")}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-[24px] border border-white/8 bg-white/[0.04] p-1">
          <TabsTrigger value="info">{t("tripsDetail.info")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("tripsDetail.expenses")}</TabsTrigger>
          <TabsTrigger value="products">{t("tripsDetail.products")}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(28,28,34,0.96)_0%,rgba(20,20,26,0.92)_100%)] shadow-[0_20px_42px_rgba(0,0,0,0.2)]">
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("tripsDetail.budget")}</p>
                  <p className="mt-1 text-[21px] font-bold tabular-nums tracking-[-0.04em]">
                    {formatAmount(budget)}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("tripsDetail.remaining")}</p>
                  <p
                    className={`mt-1 text-[21px] font-bold tabular-nums tracking-[-0.04em] ${
                      remaining < 0 ? "text-destructive" : "text-emerald-400"
                    }`}
                  >
                    {formatAmount(remaining)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">{t("trips.fundingType")}</p>
                <p className="text-[16px] font-semibold">{oldDebt > 0 ? t("trips.debtFunding") : t("trips.cashFunding")}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground">{t("tripsReport.expense")}</p>
                  <p className="text-[14px] font-semibold text-orange-500 tabular-nums">{formatAmount(spent)}</p>
                </div>
                <div className="text-center border-x border-border/40">
                  <p className="text-[11px] text-muted-foreground">{t("tripsReport.income")}</p>
                  <p className="text-[14px] font-semibold text-emerald-500 tabular-nums">+{formatAmount(income)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground">{t("trips.oldDebt")}</p>
                  <p className="text-[14px] font-semibold tabular-nums">{formatAmount(oldDebt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">{t("tripsDetail.participants")}</p>
                <div className="flex flex-col gap-2">
                  {(trip.tripCouriers ?? []).map((tc) => {
                    const name = tc.courier?.name ?? tc.courierId ?? "—";
                    const initials = name.slice(0, 2).toUpperCase();
                    return (
                      <div
                        key={tc.id}
                        className="flex items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2"
                      >
                        <Avatar className="size-10 shrink-0">
                          {tc.courier?.avatarUrl ? (
                            <AvatarImage src={getAvatarUrl(tc.courier.avatarUrl) ?? tc.courier.avatarUrl} alt={name} />
                          ) : null}
                          <AvatarFallback className="text-sm font-medium bg-primary/15 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[15px]">{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("tripsDetail.departure")}: {formatDateSafe(trip.departureDate ?? "", "d MMMM yyyy", locale)}
                {trip.returnDate && ` — ${t("tripsDetail.return")}: ${formatDateSafe(trip.returnDate, "d MMMM yyyy", locale)}`}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button asChild className="min-w-0 flex-1 rounded-[22px]">
                <Link href={`/trips/${tripId}/expenses/new`} className="inline-flex items-center justify-center gap-2 min-w-0 truncate">
                  <ArrowDownCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t("tripsDetail.addExpense")}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-w-0 flex-1 rounded-[22px] border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10">
                <Link href={`/trips/${tripId}/expenses/new?type=income`} className="inline-flex items-center justify-center gap-2 min-w-0 truncate">
                  <ArrowUpCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t("tripsDetail.addIncome")}</span>
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              {expenses.length === 0 ? (
                <Card className="rounded-2xl card-premium">
                  <CardContent className="py-8">
                    <EmptyState
                      icon={Receipt}
                      title={t("tripsDetail.noExpenses")}
                      description={t("tripsDetail.noExpensesDesc")}
                      action={
                        <Button asChild className="">
                          <Link href={`/trips/${tripId}/expenses/new`} className="inline-flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {t("tripsDetail.addExpense")}
                          </Link>
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              ) : (
                <VirtualList
                  items={expenses}
                  getItemKey={(exp) => exp.id}
                  estimateSize={88}
                  gap={8}
                  height="min(400px, 50vh)"
                  renderItem={(exp) => {
                    const isIncome = (exp as Expense & { type?: string }).type === "income";
                    return (
                      <Card
                        className={`cursor-pointer rounded-[24px] border shadow-[0_14px_28px_rgba(0,0,0,0.16)] active:scale-[0.99] ${isIncome ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/8 bg-white/[0.03]"}`}
                        onClick={() => setExpenseDetail(exp)}
                      >
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center ${isIncome ? "bg-emerald-500/10" : "bg-primary/10"}`}>
                              {isIncome ? (
                                <ArrowUpCircle className="h-6 w-6 text-emerald-500" />
                              ) : (
                                <Receipt className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-base">{exp.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateSafe(exp.createdAt ?? "", "d MMM yyyy", locale)}
                                {exp.createdByUser && ` · ${exp.createdByUser.name}`}
                              </p>
                            </div>
                          </div>
                          <p className={`font-semibold text-lg shrink-0 ${isIncome ? "text-emerald-600" : ""}`}>
                            {isIncome ? "+" : ""}{formatAmount(parseFloat(exp.amountUsd || exp.amount || "0"))}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <div className="space-y-2">
            {(role === "admin" || role === "courier") && (
              <Button asChild className="w-full rounded-[22px]">
                <Link href={`/products/new?tripId=${tripId}`} className="inline-flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t("tripsDetail.addProduct")}
                </Link>
              </Button>
            )}
            {products.length === 0 ? (
              <Card className="rounded-2xl card-premium">
                <CardContent className="py-8">
                  <EmptyState
                    icon={Package}
                    title={t("tripsDetail.noProducts")}
                    description={t("tripsDetail.noProductsDesc")}
                    action={(role === "admin" || role === "courier") ? (
                      <Button asChild>
                        <Link href={`/products/new?tripId=${tripId}`} className="inline-flex items-center justify-center gap-2">
                          <Plus className="h-4 w-4" />
                          {t("tripsDetail.addProduct")}
                        </Link>
                      </Button>
                    ) : undefined}
                  />
                </CardContent>
              </Card>
            ) : (
              <VirtualList
                items={products}
                getItemKey={(prod) => prod.id}
                estimateSize={120}
                gap={8}
                height="min(400px, 50vh)"
                renderItem={(prod) => (
                  <Card
                    className="cursor-pointer overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] shadow-[0_14px_28px_rgba(0,0,0,0.16)] active:scale-[0.99]"
                    onClick={() => setProductDetail(prod)}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-4">
                        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-muted">
                          {getProductCoverImageUrl(prod) ? (
                            <img
                              key={`${prod.id}-${getProductCoverImageUrl(prod) ?? "no-image"}`}
                              src={getProductCoverImageUrl(prod)}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[15px] leading-tight break-words">{prod.name}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-sm text-muted-foreground">
                              {prod.quantity} {getLocalizedProductUnit(t, prod.unit)}
                            </span>
                            {prod.shop && (
                              <Badge variant="secondary" className="text-xs font-normal gap-1">
                                <Store className="h-3 w-3" />
                                {prod.shop.name}
                              </Badge>
                            )}
                          </div>
                          {prod.salePrice && (
                            <p className="text-sm font-semibold text-emerald-600 mt-1">
                              {formatAmount(parseFloat(prod.salePrice))}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ExpenseDetailSheet
        open={!!expenseDetail}
        onOpenChange={(open) => !open && setExpenseDetail(null)}
        expense={expenseDetail}
        tripCurrency={trip.currency}
      />
      <ProductDetailSheet
        open={!!productDetail}
        onOpenChange={(open) => !open && setProductDetail(null)}
        product={productDetail}
        trip={trip}
        courierName={undefined}
        canEdit={role === "admin" || role === "courier"}
        onProductDeleted={() => {
          setProducts((p) => p.filter((x) => x.id !== productDetail?.id));
          setProductDetail(null);
        }}
      />
    </div>
  );
}
