"use client";

import { useEffect, useState } from "react";
import { getProductsByTrips } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import type { Product, Trip } from "@/types";
import { Package, Store } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductDetailSheet } from "@/components/trips/ProductDetailSheet";
import { VirtualList } from "@/components/ui/virtual-list";
import { useTranslations } from "@/lib/useTranslations";

export function ProductsList() {
  const { t } = useTranslations();
  const { formatAmount } = useFormattedAmount();
  const [products, setProducts] = useState<Product[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = () => {
    setLoading(true);
    setError(null);
    getTrips(1, 50)
      .then(async (r) => {
        setTrips(r.trips);
        const ids = r.trips.map((t) => t.id);
        const prods = await getProductsByTrips(ids);
        setProducts(prods);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <DataErrorState message={error} onRetry={loadProducts} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <EmptyState
          icon={Package}
          title={t("tripsDetail.noProducts")}
          description={t("products.addFirst")}
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
                      src={getAvatarUrl(prod.imageUrl) ?? prod.imageUrl}
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
                  <p className="text-xs text-muted-foreground mt-0.5">{trip?.name ?? "-"}</p>
                  {prod.salePrice && (
                    <p className="text-sm font-semibold text-emerald-600 mt-1">
                      {formatAmount(parseFloat(prod.salePrice))}
                    </p>
                  )}
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
        canEdit={true}
        onProductUpdated={(updated) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          setProductDetail(updated);
        }}
        onProductDeleted={() => {
          if (productDetail) {
            setProducts((prev) => prev.filter((p) => p.id !== productDetail.id));
            setProductDetail(null);
          }
        }}
      />
    </>
  );
}
