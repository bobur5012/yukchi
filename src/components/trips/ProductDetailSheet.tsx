"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Package } from "lucide-react";
import type { Product } from "@/types";
import type { Trip } from "@/types";

interface ProductDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  trip?: Trip | null;
  courierName?: string;
}

export function ProductDetailSheet({
  open,
  onOpenChange,
  product,
  trip,
  courierName,
}: ProductDetailSheetProps) {
  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          {product.imageUrl ? (
            <div className="rounded-xl overflow-hidden border border-border/50">
              <img
                src={product.imageUrl}
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
          <div>
            <p className="text-[13px] text-muted-foreground">Себестоимость</p>
            <p className="text-[20px] font-semibold tabular-nums tracking-[-0.03em]">
              {product.costPrice} $
            </p>
          </div>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
