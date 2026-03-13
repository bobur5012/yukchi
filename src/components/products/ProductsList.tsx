"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductsByTrips } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import type { Product, Trip } from "@/types";
import { Package, Store, Truck, Search, Boxes, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductDetailSheet } from "@/components/trips/ProductDetailSheet";
import { VirtualList } from "@/components/ui/virtual-list";
import { useTranslations } from "@/lib/useTranslations";
import { Input } from "@/components/ui/input";
import { getProductSalePrice, getProductTotalDelivery, getProductTotalSale } from "@/lib/product-math";
import { getLocalizedProductUnit } from "@/lib/product-units";
import { getProductCoverImageUrl } from "@/lib/product-media";

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
  const [search, setSearch] = useState("");

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
      .catch((e) => setError(e instanceof Error ? e.message : t("common.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    getTrips(1, 50)
      .then(async (r) => {
        if (!active) return;
        setTrips(r.trips);
        const ids = r.trips.map((trip) => trip.id);
        const prods = await getProductsByTrips(ids);
        if (active) {
          setProducts(prods);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : t("common.loadError"));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [t]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const trip = trips.find((item) => item.id === product.tripId);
      return (
        product.name.toLowerCase().includes(query) ||
        product.shop?.name?.toLowerCase().includes(query) ||
        trip?.name?.toLowerCase().includes(query)
      );
    });
  }, [products, search, trips]);

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
      <div className="space-y-4">
        <div className="rounded-[26px] border border-border/35 bg-card/95 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[20px] font-semibold tracking-[-0.04em]">
                {t("titles.products")}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {t("products.searchHint")}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Package className="size-4.5" />
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("products.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-2xl border-border/35 bg-background/60 pl-10"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <EmptyState
              icon={Package}
              title={t("products.emptyFilteredTitle")}
              description={t("products.emptyFilteredDescription")}
            />
          </div>
        ) : (
          <VirtualList
            items={filteredProducts}
            className="pb-1"
            getItemKey={(prod) => prod.id}
            estimateSize={148}
            gap={12}
            renderItem={(prod) => {
              const trip = trips.find((item) => item.id === prod.tripId);
              const productPrice = getProductSalePrice(prod);
              const totalProduct = getProductTotalSale(prod);
              const totalDelivery = getProductTotalDelivery(prod);
              const imageSrc = getProductCoverImageUrl(prod);

              return (
                <div
                  className="cursor-pointer overflow-hidden rounded-[24px] border border-border/35 bg-card/95 p-2.5 shadow-[0_12px_26px_rgba(0,0,0,0.14)] transition-transform active:scale-[0.99]"
                  onClick={() => setProductDetail(prod)}
                >
                  <div className="flex gap-2.5">
                    <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[20px] border border-border/35 bg-muted">
                      {imageSrc ? (
                        <img
                          key={`${prod.id}-${imageSrc ?? "no-image"}`}
                          src={imageSrc}
                          alt={prod.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/8">
                          <Package className="h-7 w-7 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute left-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                        {formatCreatedAt(prod.createdAt)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight tracking-[-0.02em]">
                          {prod.name}
                        </h3>
                        <div className="rounded-full border border-border/30 bg-background/50 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                          {prod.quantity} {getLocalizedProductUnit(t, prod.unit)}
                        </div>
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {prod.shop ? (
                          <Badge variant="secondary" className="max-w-full gap-1 rounded-full border border-border/20 bg-background/55 px-2 py-0.5 text-[10px] font-normal">
                            <Store className="h-3 w-3 shrink-0" />
                            <span className="truncate">{prod.shop.name}</span>
                          </Badge>
                        ) : null}
                        {trip ? (
                          <Badge variant="secondary" className="max-w-full gap-1 rounded-full border border-border/20 bg-background/55 px-2 py-0.5 text-[10px] font-normal">
                            <Plane className="h-3 w-3 shrink-0" />
                            <span className="truncate">{trip.name}</span>
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 p-2">
                          <p className="text-[10px] text-muted-foreground">{t("productsReport.saleLabel")}</p>
                          <p className="mt-0.5 truncate text-[13px] font-semibold tabular-nums">
                            {totalProduct > 0 ? formatAmount(totalProduct) : "—"}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-amber-500/20 bg-amber-500/10 p-2">
                          <p className="text-[10px] text-muted-foreground">{t("products.delivery")}</p>
                          <p className="mt-0.5 truncate text-[13px] font-semibold tabular-nums">
                            {totalDelivery > 0 ? formatAmount(totalDelivery) : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Boxes className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {t("products.unitPrice")}: {productPrice > 0 ? formatAmount(productPrice) : "—"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Truck className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {t("products.delivery")}: {totalDelivery > 0 ? formatAmount(totalDelivery) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

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
