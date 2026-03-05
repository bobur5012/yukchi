"use client";

import { useEffect, useState } from "react";
import { getProductsByTrips } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import type { Product, Trip } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, DollarSign, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalDateInputValue } from "@/lib/date-utils";
import { useFormattedAmount } from "@/lib/useFormattedAmount";

function toNum(value?: string | null): number {
  return Number.parseFloat(value || "0") || 0;
}

function isSameDay(a: string, b: string): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function ProductsReport() {
  const { formatAmount } = useFormattedAmount();
  const [products, setProducts] = useState<Product[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    getTrips(1, 50)
      .then(async (r) => {
        setTrips(r.trips);
        const ids = r.trips.map((t) => t.id);
        const prods = await getProductsByTrips(ids);
        setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = selectedDate
    ? products.filter((p) => p.createdAt && isSameDay(p.createdAt, selectedDate))
    : products;

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="rounded-2xl animate-pulse">
          <CardContent className="p-6 h-32" />
        </Card>
      </div>
    );
  }

  const totalQuantity = filteredProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalSale = filteredProducts.reduce((sum, p) => sum + p.quantity * toNum(p.salePrice ?? p.salePriceUsd), 0);
  const totalDelivery = filteredProducts.reduce((sum, p) => {
    const perKgDelivery = toNum(p.pricePerKg ?? p.pricePerKgUsd);
    if (perKgDelivery > 0) return sum + p.quantity * perKgDelivery;
    return sum + toNum(p.costPrice ?? p.costPriceUsd);
  }, 0);
  const grandTotal = totalSale + totalDelivery;

  const byTrip = trips
    .map((trip) => ({
      trip,
      products: filteredProducts.filter((p) => p.tripId === trip.id),
    }))
    .filter((x) => x.products.length > 0);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Фильтр по дате</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={selectedDate ?? ""}
              onChange={(e) => setSelectedDate(e.target.value || null)}
              className="h-11 rounded-xl flex-1"
            />
            {selectedDate && (
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)} className="shrink-0">
                Сбросить
              </Button>
            )}
          </div>
          {selectedDate ? (
            <p className="text-xs text-muted-foreground mt-1">Показаны товары за {selectedDate}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Показаны все товары</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm">Товаров</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em]">{filteredProducts.length}</p>
            <p className="text-xs text-muted-foreground">{totalQuantity.toLocaleString("ru-RU")} ед.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Продажа (итого)</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em] text-emerald-500">
              {totalSale.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} $
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Truck className="h-4 w-4" />
              <span className="text-sm">Доставка (итого)</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em]">
              {totalDelivery.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} $
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Общий итог</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em]">
              {grandTotal.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} $
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">По поездкам</h3>
          <div className="space-y-2">
            {byTrip.map(({ trip, products: prods }) => {
              const tripSale = prods.reduce((sum, p) => sum + p.quantity * toNum(p.salePrice), 0);
              const tripDelivery = prods.reduce((sum, p) => {
                const perKg = toNum(p.pricePerKg);
                if (perKg > 0) return sum + p.quantity * perKg;
                return sum + toNum(p.costPrice);
              }, 0);
              return (
                <div key={trip.id} className="rounded-xl bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{trip.name}</p>
                    <p className="text-xs text-muted-foreground shrink-0">{prods.length} товар(ов)</p>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-muted-foreground">Продажа</div>
                    <div className="text-muted-foreground">Доставка</div>
                    <div className="text-muted-foreground">Итого</div>
                    <div className="font-medium tabular-nums text-emerald-500">{tripSale.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} $</div>
                    <div className="font-medium tabular-nums">{tripDelivery.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} $</div>
                    <div className="font-semibold tabular-nums">{(tripSale + tripDelivery).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} $</div>
                  </div>
                </div>
              );
            })}
            {byTrip.length === 0 && <p className="text-sm text-muted-foreground py-2">Нет товаров</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Детали по товарам</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const trip = trips.find((t) => t.id === p.tripId);
                const sale = toNum(p.salePrice ?? p.salePriceUsd) * p.quantity;
                const del = toNum(p.pricePerKg ?? p.pricePerKgUsd) > 0
                  ? toNum(p.pricePerKg ?? p.pricePerKgUsd) * p.quantity
                  : toNum(p.costPrice ?? p.costPriceUsd);
                const total = sale + del;
                const createdDate = p.createdAt
                  ? new Date(p.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "—";
                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-xl bg-muted/30 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip?.name ?? "—"} • {p.shop?.name ?? "—"} • {createdDate}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold tabular-nums">{formatAmount(total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.quantity} {p.unit ?? "шт"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Нет товаров</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
