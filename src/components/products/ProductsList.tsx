"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductsByTrips } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import type { Product, Trip } from "@/types";
import { Package, Store, Truck, Search, ImageIcon, Boxes, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductDetailSheet } from "@/components/trips/ProductDetailSheet";
import { VirtualList } from "@/components/ui/virtual-list";
import { useTranslations } from "@/lib/useTranslations";
import { getAvatarUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function toNum(value?: string | null): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
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
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

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

  const withPhotoCount = filteredProducts.filter((product) => Boolean(product.imageUrl)).length;
  const linkedShopCount = filteredProducts.filter((product) => Boolean(product.shop?.id)).length;
  const totalValue = filteredProducts.reduce((sum, product) => {
    const unitPrice = toNum(product.salePrice ?? product.salePriceUsd);
    return sum + unitPrice * product.quantity;
  }, 0);

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
        <div className="rounded-[28px] border border-border/40 bg-card/95 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.16)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[22px] font-semibold tracking-[-0.04em]">
                {t("titles.products")}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {t("products.searchHint")}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Package className="size-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-border/30 bg-background/50 p-3">
              <p className="text-[11px] text-muted-foreground">{t("products.totalCount")}</p>
              <p className="mt-1 text-[22px] font-semibold tabular-nums">
                {filteredProducts.length}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
              <p className="text-[11px] text-muted-foreground">{t("products.withPhotoCount")}</p>
              <p className="mt-1 text-[22px] font-semibold tabular-nums">{withPhotoCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <p className="text-[11px] text-muted-foreground">{t("products.totalValue")}</p>
              <p className="mt-1 truncate text-[18px] font-semibold tabular-nums">
                {formatAmount(totalValue)}
              </p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("products.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl border-border/40 bg-background/60 pl-10"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/50 px-3 py-1.5 text-[12px] text-muted-foreground">
              <ImageIcon className="size-3.5" />
              <span>{withPhotoCount} {t("products.photosBadge")}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/50 px-3 py-1.5 text-[12px] text-muted-foreground">
              <Store className="size-3.5" />
              <span>{linkedShopCount} {t("products.linkedShopsBadge")}</span>
            </div>
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
            estimateSize={176}
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
              const imageSrc = getAvatarUrl(prod.imageUrl, `${prod.id}-${prod.createdAt ?? "1"}`);

              return (
                <div
                  className="cursor-pointer overflow-hidden rounded-[28px] border border-border/40 bg-card/95 p-3 shadow-[0_14px_34px_rgba(0,0,0,0.16)] transition-transform active:scale-[0.99]"
                  onClick={() => setProductDetail(prod)}
                >
                  <div className="flex gap-3">
                    <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[22px] border border-border/40 bg-muted">
                      {imageSrc ? (
                        <img
                          key={`${prod.id}-${prod.imageUrl ?? "no-image"}`}
                          src={imageSrc}
                          alt={prod.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/8">
                          <Package className="h-9 w-9 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                        {formatCreatedAt(prod.createdAt)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-[16px] font-semibold leading-tight tracking-[-0.02em]">
                          {prod.name}
                        </h3>
                        <div className="rounded-full border border-border/30 bg-background/50 px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted-foreground">
                          {prod.quantity} {prod.unit ?? "шт"}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {prod.shop ? (
                          <Badge variant="secondary" className="max-w-full gap-1 rounded-full border border-border/20 bg-background/55 px-2.5 py-1 text-[11px] font-normal">
                            <Store className="h-3 w-3 shrink-0" />
                            <span className="truncate">{prod.shop.name}</span>
                          </Badge>
                        ) : null}
                        {trip ? (
                          <Badge variant="secondary" className="max-w-full gap-1 rounded-full border border-border/20 bg-background/55 px-2.5 py-1 text-[11px] font-normal">
                            <Plane className="h-3 w-3 shrink-0" />
                            <span className="truncate">{trip.name}</span>
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                          <p className="text-[11px] text-muted-foreground">{t("products.saleLabel")}</p>
                          <p className="mt-1 truncate text-[14px] font-semibold tabular-nums">
                            {totalProduct > 0 ? formatAmount(totalProduct) : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-2.5">
                          <p className="text-[11px] text-muted-foreground">{t("products.delivery")}</p>
                          <p className="mt-1 truncate text-[14px] font-semibold tabular-nums">
                            {totalDelivery > 0 ? formatAmount(totalDelivery) : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Boxes className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {t("products.unitPrice")}: {unitPrice > 0 ? formatAmount(unitPrice) : "—"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
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
