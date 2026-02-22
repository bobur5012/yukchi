"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import type { Product, Trip } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign } from "lucide-react";

export function ProductsReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrips(1, 50).then(async (r) => {
      setTrips(r.trips);
      const allProducts: Product[] = [];
      for (const t of r.trips) {
        const prods = await getProducts(t.id);
        allProducts.push(...prods);
      }
      setProducts(allProducts);
    }).finally(() => setLoading(false));
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

  const totalCost = products.reduce((s, p) => s + parseFloat(p.costPrice || "0"), 0);
  const totalQuantity = products.reduce((s, p) => s + p.quantity, 0);

  const byTrip = trips.map((t) => ({
    trip: t,
    products: products.filter((p) => p.tripId === t.id),
  })).filter((x) => x.products.length > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm">Товаров</span>
            </div>
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-muted-foreground">
              {totalQuantity} шт.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Себестоимость</span>
            </div>
            <p className="text-2xl font-bold">
              {totalCost.toLocaleString()} $
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">По поездкам</h3>
          <div className="space-y-2">
            {byTrip.map(({ trip, products: prods }) => {
              const cost = prods.reduce((s, p) => s + parseFloat(p.costPrice || "0"), 0);
              const qty = prods.reduce((s, p) => s + p.quantity, 0);
              return (
                <div
                  key={trip.id}
                  className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/30"
                >
                  <p className="font-medium truncate">{trip.name}</p>
                  <div className="text-right text-sm shrink-0">
                    <p>{prods.length} товаров · {qty} шт.</p>
                    <p className="font-medium">{cost.toLocaleString()} $</p>
                  </div>
                </div>
              );
            })}
            {byTrip.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                Нет товаров
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
