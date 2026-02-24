"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrip } from "@/lib/api/trips";
import { getProducts } from "@/lib/api/products";
import { getCouriers } from "@/lib/api/couriers";
import { formatDateSafe } from "@/lib/date-utils";
import { useTranslations } from "@/lib/useTranslations";
import { useAuthStore } from "@/stores/auth";
import type { Trip, Product, Expense } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { ExpenseDetailSheet } from "./ExpenseDetailSheet";
import { ProductDetailSheet } from "./ProductDetailSheet";
import { VirtualList } from "@/components/ui/virtual-list";

interface TripDetailProps {
  tripId: string;
}

export function TripDetail({ tripId }: TripDetailProps) {
  const { t, locale } = useTranslations();
  const role = useAuthStore((s) => s.user?.role);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [courierNames, setCourierNames] = useState<Record<string, string>>({});
  const [expenseDetail, setExpenseDetail] = useState<Expense | null>(null);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const showAddedBy = role === "admin";

  useEffect(() => {
    getTrip(tripId).then(setTrip);
  }, [tripId]);

  useEffect(() => {
    if (tripId) getProducts(tripId).then(setProducts);
  }, [tripId]);

  useEffect(() => {
    getCouriers().then((list) => {
      const map: Record<string, string> = {};
      list.forEach((c) => { map[String(c.id)] = c.name; });
      setCourierNames(map);
    });
  }, []);

  if (trip === null) {
    return <ListSkeleton count={3} />;
  }

  if (!trip) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("tripsDetail.notFound")}
      </div>
    );
  }

  const expenses = trip.expenses ?? [];
  const spent = expenses.reduce((s, e) => s + parseFloat(e.amount || "0"), 0);
  const budgetNum = parseFloat(trip.budget || "0");
  const remaining = budgetNum - spent;

  return (
    <div className="space-y-4 pb-20">
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
                  {trip.budget} {trip.currency}
                </p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">{t("tripsDetail.remaining")}</p>
                <p
                  className={`text-[20px] font-bold tabular-nums tracking-[-0.03em] ${
                    remaining < 0 ? "text-destructive" : ""
                  }`}
                >
                  {remaining} {trip.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t("tripsDetail.participants")}</p>
                <div className="flex flex-wrap gap-2">
                  {(trip.tripCouriers ?? []).map((tc) => (
                    <Badge key={tc.id} variant="secondary">
                      {tc.courier?.name ?? tc.courierId}
                    </Badge>
                  ))}
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
            <Button asChild className="w-full sticky top-14 z-10">
              <Link href={`/trips/${tripId}/expenses/new`} className="inline-flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                {t("tripsDetail.addExpense")}
              </Link>
            </Button>
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
                  estimateSize={88}
                  gap={8}
                  height="min(400px, 50vh)"
                  renderItem={(exp) => (
                    <Card
                      className="rounded-2xl card-premium cursor-pointer active:scale-[0.99]"
                      onClick={() => setExpenseDetail(exp)}
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-base">{exp.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateSafe(exp.createdAt ?? "", "d MMM yyyy", locale)}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-lg shrink-0">
                          {exp.amount} {exp.currency || trip.currency}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <div className="space-y-2">
            {products.length === 0 ? (
              <Card className="rounded-2xl card-premium">
                <CardContent className="py-8">
                  <EmptyState
                    icon={Package}
                    title="Нет товаров"
                    description="В этой поездке пока нет товаров"
                  />
                </CardContent>
              </Card>
            ) : (
              <VirtualList
                items={products}
                estimateSize={88}
                gap={8}
                height="min(400px, 50vh)"
                renderItem={(prod) => (
                  <Card
                    className="rounded-2xl card-premium cursor-pointer active:scale-[0.99]"
                    onClick={() => setProductDetail(prod)}
                  >
                    <CardContent className="p-4">
                      <p className="font-medium">{prod.name}</p>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Кол-во: {prod.quantity}</span>
                        <span>Себестоимость: {prod.costPrice} $</span>
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
      />
    </div>
  );
}
