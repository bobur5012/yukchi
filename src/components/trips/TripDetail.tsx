"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getTrip } from "@/lib/api/trips";
import { getProducts } from "@/lib/api/products";
import { getCouriers } from "@/lib/api/couriers";
import { formatDateSafe } from "@/lib/date-utils";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import { useTranslations } from "@/lib/useTranslations";
import { useAuthStore } from "@/stores/auth";
import type { Trip, Product, Expense } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Receipt, Package, Store, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAvatarUrl } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { ExpenseDetailSheet } from "./ExpenseDetailSheet";
import { ProductDetailSheet } from "./ProductDetailSheet";
import { VirtualList } from "@/components/ui/virtual-list";

interface TripDetailProps {
  tripId: string;
}

export function TripDetail({ tripId }: TripDetailProps) {
  const { t, locale } = useTranslations();
  const { formatAmount } = useFormattedAmount();
  const role = useAuthStore((s) => s.user?.role);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [courierNames, setCourierNames] = useState<Record<string, string>>({});
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
      getCouriers(),
    ])
      .then(([tripData, productsData, couriersData]) => {
        setTrip(tripData ?? null);
        setProducts(productsData);
        const map: Record<string, string> = {};
        couriersData.forEach((c) => { map[String(c.id)] = c.name; });
        setCourierNames(map);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

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
  const remaining = budget - spent + income;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-2xl">
          <TabsTrigger value="info">{t("tripsDetail.info")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("tripsDetail.expenses")}</TabsTrigger>
          <TabsTrigger value="products">{t("tripsDetail.products")}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card className="rounded-2xl card-premium">
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-[13px] text-muted-foreground">{t("tripsDetail.budget")}</p>
                <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em]">
                  {formatAmount(budget)}
                </p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">{t("tripsDetail.remaining")}</p>
                <p
                  className={`text-[20px] font-bold tabular-nums tracking-[-0.03em] ${
                    remaining < 0 ? "text-destructive" : ""
                  }`}
                >
                  {formatAmount(Math.max(0, remaining))}
                </p>
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
                        className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2"
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
              <Button asChild className="flex-1 min-w-0">
                <Link href={`/trips/${tripId}/expenses/new`} className="inline-flex items-center justify-center gap-2 min-w-0 truncate">
                  <ArrowDownCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t("tripsDetail.addExpense")}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 min-w-0 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10">
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
                        className={`rounded-2xl card-premium cursor-pointer active:scale-[0.99] ${isIncome ? "border-emerald-500/30" : ""}`}
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
              <Button asChild className="w-full">
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
                    className="rounded-2xl card-premium cursor-pointer active:scale-[0.99] overflow-hidden"
                    onClick={() => setProductDetail(prod)}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-4">
                        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-muted">
                          {prod.imageUrl ? (
                            <img
                              src={getAvatarUrl(prod.imageUrl, prod.id)}
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
                          <p className="font-semibold text-[15px] truncate">{prod.name}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-sm text-muted-foreground">
                              {prod.quantity} {prod.unit ?? "шт"}
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
