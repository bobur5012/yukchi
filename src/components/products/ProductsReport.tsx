"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import type { Product, Trip } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign, Truck } from "lucide-react";

function toNum(value?: string | null): number {
  return Number.parseFloat(value || "0") || 0;
}

export function ProductsReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrips(1, 50)
      .then(async (r) => {
        setTrips(r.trips);
        const allProducts: Product[] = [];
        for (const trip of r.trips) {
          const prods = await getProducts(trip.id);
          allProducts.push(...prods);
        }
        setProducts(allProducts);
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

  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalSale = products.reduce((sum, p) => sum + p.quantity * toNum(p.salePrice), 0);
  const totalDelivery = products.reduce((sum, p) => {
    const perKgDelivery = toNum(p.pricePerKg);
    if (perKgDelivery > 0) {
      return sum + p.quantity * perKgDelivery;
    }
    const fixedDelivery = toNum(p.costPrice);
    return sum + fixedDelivery;
  }, 0);
  const grandTotal = totalSale + totalDelivery;

  const byTrip = trips
    .map((trip) => ({
      trip,
      products: products.filter((p) => p.tripId === trip.id),
    }))
    .filter((x) => x.products.length > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm">Товаров</span>
            </div>
            <p className="text-[20px] font-bold tabular-nums tracking-[-0.03em]">{products.length}</p>
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
    </div>
  );
}
