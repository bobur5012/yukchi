"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import type { Product, Trip } from "@/types";
import { Package } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductDetailSheet } from "@/components/trips/ProductDetailSheet";
import { VirtualList } from "@/components/ui/virtual-list";

export function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = () => {
    getTrips(1, 50).then(async (r) => {
      setTrips(r.trips);
      const allProducts: Product[] = [];
      for (const t of r.trips) {
        const prods = await getProducts(t.id);
        allProducts.push(...prods);
      }
      setProducts(allProducts);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <EmptyState
          icon={Package}
          title="Нет товаров"
          description="Добавьте первый товар"
        />
      </div>
    );
  }

  return (
    <>
      <VirtualList
        items={products}
        estimateSize={120}
        gap={16}
        renderItem={(prod) => {
          const trip = trips.find((t) => t.id === prod.tripId);
          return (
            <div
              className="rounded-2xl border border-border/50 bg-card p-4 card-premium overflow-hidden cursor-pointer active:scale-[0.99]"
              onClick={() => setProductDetail(prod)}
            >
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold truncate">
                    {prod.name}
                  </h3>
                  <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    <p>Кол-во: {prod.quantity}</p>
                    <p className="font-medium text-foreground">
                      Себестоимость: {prod.costPrice} $
                    </p>
                    <p className="text-xs">{trip?.name ?? "-"}</p>
                    {prod.shop && (
                      <p className="text-xs text-primary">→ {prod.shop.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />
      <ProductDetailSheet
        open={!!productDetail}
        onOpenChange={(open) => !open && setProductDetail(null)}
        product={productDetail}
        trip={productDetail ? trips.find((t) => t.id === productDetail.tripId) ?? null : null}
        courierName={undefined}
        onProductUpdated={(updated) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          setProductDetail(updated);
        }}
      />
    </>
  );
}
