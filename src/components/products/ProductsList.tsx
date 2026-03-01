"use client";

import { useEffect, useState } from "react";
import { getProductsByTrips } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import type { Product, Trip } from "@/types";
import { Package, Store, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductDetailSheet } from "@/components/trips/ProductDetailSheet";
import { VirtualList } from "@/components/ui/virtual-list";
import { useTranslations } from "@/lib/useTranslations";

function toNum(value?: string | null): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function withVersion(url?: string | null, version?: string): string | undefined {
  if (!url) return undefined;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}v=${encodeURIComponent(version ?? "1")}`;
}

function formatCreatedAt(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
        const ids = r.trips.map((trip) => trip.id);
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
        getItemKey={(prod) => prod.id}
        estimateSize={128}
        gap={12}
        renderItem={(prod) => {
          const trip = trips.find((item) => item.id === prod.tripId);
          const unitPrice = toNum(prod.salePrice ?? prod.salePriceUsd);
          const totalProduct = unitPrice > 0 ? unitPrice * prod.quantity : 0;
          const deliveryPerKg = toNum(prod.pricePerKg ?? prod.pricePerKgUsd);
          const fixedDelivery = toNum(prod.costPrice ?? prod.costPriceUsd);
          const totalDelivery = deliveryPerKg > 0
            ? deliveryPerKg * prod.quantity
            : fixedDelivery > 0
              ? fixedDelivery
              : 0;
          const imageSrc = withVersion(prod.imageUrl, `${prod.id}-${prod.createdAt ?? "1"}`);

          return (
            <div
              className="rounded-2xl border border-border/60 bg-card/95 p-3 card-premium shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)] overflow-hidden cursor-pointer active:scale-[0.99]"
              onClick={() => setProductDetail(prod)}
            >
              <div className="flex gap-3">
                <div className="h-[72px] w-[72px] rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                  {imageSrc ? (
                    <img
                      key={`${prod.id}-${prod.imageUrl ?? "no-image"}`}
                      src={imageSrc}
                      alt={prod.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold leading-tight break-words line-clamp-2">
                      {prod.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground shrink-0">
                      {formatCreatedAt(prod.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      {prod.quantity} {prod.unit ?? "шт"}
                    </span>
                    {prod.shop ? (
                      <Badge variant="secondary" className="text-[11px] font-normal gap-1 max-w-full">
                        <Store className="h-3 w-3 shrink-0" />
                        <span className="truncate">{prod.shop.name}</span>
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="text-muted-foreground">
                      Цена: {unitPrice > 0 ? formatAmount(unitPrice) : "—"}
                    </span>
                    <span className="font-semibold text-emerald-600">
                      Итого: {totalProduct > 0 ? formatAmount(totalProduct) : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Truck className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      Доставка: {totalDelivery > 0 ? formatAmount(totalDelivery) : "—"}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate">
                    Поездка: {trip?.name ?? "—"}
                  </p>
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
        trip={productDetail ? trips.find((trip) => trip.id === productDetail.tripId) ?? null : null}
        courierName={undefined}
        canEdit
        onProductUpdated={(updated) => {
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setProductDetail(updated);
        }}
        onProductDeleted={() => {
          if (!productDetail) return;
          setProducts((prev) => prev.filter((p) => p.id !== productDetail.id));
          setProductDetail(null);
        }}
      />
    </>
  );
}
