"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Package, Store } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import type { Product } from "@/types";
import type { Trip } from "@/types";
import { getShops } from "@/lib/api/shops";
import { updateProduct } from "@/lib/api/products";
import type { Shop } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProductDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  trip?: Trip | null;
  courierName?: string;
  onProductUpdated?: (product: Product) => void;
}

export function ProductDetailSheet({
  open,
  onOpenChange,
  product,
  trip,
  courierName,
  onProductUpdated,
}: ProductDetailSheetProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<string | null>(product?.shopId ?? product?.shop?.id ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      getShops(1, 100).then((r) => setShops(r.shops));
      setShopId(product?.shopId ?? product?.shop?.id ?? null);
    }
  }, [open, product]);

  const handleAttachShop = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const updated = await updateProduct(product.id, { shopId: shopId || null });
      onProductUpdated?.(updated);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          {product.shop && (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-[15px] font-medium">Магазин: {product.shop.name}</span>
            </div>
          )}
          {product.imageUrl ? (
            <div className="rounded-xl overflow-hidden border border-border/50">
              <img
                src={getAvatarUrl(product.imageUrl) ?? product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            </div>
          ) : (
            <div className="h-32 rounded-xl bg-muted flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <div>
            <p className="text-[13px] text-muted-foreground">Количество</p>
            <p className="text-[15px] font-medium">{product.quantity}</p>
          </div>
          {(product.salePrice || product.pricePerKg) && (
            <div>
              <p className="text-[13px] text-muted-foreground">Цена</p>
              <p className="text-[20px] font-semibold tabular-nums tracking-[-0.03em] text-emerald-600">
                {product.salePrice ? `${product.salePrice} $` : product.pricePerKg ? `${product.pricePerKg} $ / ${product.unit ?? "шт"}` : "—"}
              </p>
            </div>
          )}
          {trip && (
            <div>
              <p className="text-[13px] text-muted-foreground">Поездка</p>
              <p className="text-[15px] font-medium">{trip.name}</p>
            </div>
          )}
          {courierName && (
            <div>
              <p className="text-[13px] text-muted-foreground">Курьер</p>
              <p className="text-[15px] font-medium">{courierName}</p>
            </div>
          )}
          <div>
            <p className="text-[13px] text-muted-foreground mb-2">Привязать к магазину</p>
            <div className="flex gap-2">
              <Select
                value={shopId ?? "none"}
                onValueChange={(v) => setShopId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите магазин" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не привязан</SelectItem>
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAttachShop}
                disabled={saving || (shopId ?? "none") === (product.shopId ?? product.shop?.id ?? "none")}
              >
                {saving ? "Сохраняем…" : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
