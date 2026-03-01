"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import imageCompression from "browser-image-compression";
import { ImagePlus, Camera, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

import { createProduct } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import { getShops } from "@/lib/api/shops";
import { uploadProductImage } from "@/lib/api/storage";
import type { Shop, Trip } from "@/types";

const NO_SHOP_VALUE = "none";

const UNIT_OPTIONS = [
  { value: "шт", label: "ШТ" },
  { value: "кг", label: "КГ" },
  { value: "грамм", label: "ГРАММ" },
  { value: "л", label: "Л" },
  { value: "м", label: "М" },
  { value: "упаковка", label: "УПАКОВКА" },
  { value: "коробка", label: "КОРОБКА" },
  { value: "пачка", label: "ПАЧКА" },
] as const;

type DeliveryMode = "per_kg" | "fixed";

function formatMoney(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(2)} $`;
}

type CalcRowProps = {
  label: string;
  formula?: string;
  value: string;
  highlight?: boolean;
};

function CalcRow({ label, formula, value, highlight = false }: CalcRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-2">
      <div className="min-w-0">
        <p className="break-words text-sm text-muted-foreground">{label}</p>
        {formula ? (
          <p className="break-words text-xs text-muted-foreground/80">{formula}</p>
        ) : null}
      </div>
      <p className={`whitespace-nowrap text-right text-base font-semibold ${highlight ? "text-emerald-500" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export function AddProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tripIdFromUrl = searchParams.get("tripId") ?? "";
  const shopIdFromUrl = searchParams.get("shopId") ?? "";

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>(UNIT_OPTIONS[0].value);
  const [salePrice, setSalePrice] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("per_kg");
  const [deliveryPrice, setDeliveryPrice] = useState("");
  const [description, setDescription] = useState("");
  const [tripId, setTripId] = useState(tripIdFromUrl);
  const [shopId, setShopId] = useState(shopIdFromUrl || NO_SHOP_VALUE);
  const [shopSearch, setShopSearch] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoadingData(true);
    setDataError(null);
    Promise.all([getTrips(1, 50), getShops(1, 100)])
      .then(([tripsRes, shopsRes]) => {
        setTrips(tripsRes.trips);
        setShops(shopsRes.shops);
      })
      .catch((e) => setDataError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    if (tripIdFromUrl) setTripId(tripIdFromUrl);
    setShopId(shopIdFromUrl || NO_SHOP_VALUE);
  }, [tripIdFromUrl, shopIdFromUrl]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const activeTrips = useMemo(
    () => trips.filter((trip) => trip.status === "active" || trip.status === "planned"),
    [trips]
  );

  const filteredShops = useMemo(() => {
    const q = shopSearch.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((shop) => shop.name.toLowerCase().includes(q));
  }, [shopSearch, shops]);

  const parsedQty = Number.parseFloat(quantity);
  const qty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 0;
  const qtyInt = Number.isFinite(parsedQty) && parsedQty > 0 ? Math.floor(parsedQty) : 0;
  const sale = Number.parseFloat(salePrice) || 0;
  const delivery = Number.parseFloat(deliveryPrice) || 0;

  const totalSale = sale > 0 && qty > 0 ? sale * qty : null;
  const totalDelivery = delivery > 0
    ? deliveryMode === "per_kg"
      ? qty > 0
        ? delivery * qty
        : null
      : delivery
    : null;
  const totalFinal = totalSale !== null || totalDelivery !== null
    ? (totalSale ?? 0) + (totalDelivery ?? 0)
    : null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || qtyInt <= 0 || !tripId) {
      toast.error("Заполните название, количество и поездку");
      return;
    }
    if (!imageFile) {
      toast.error("Фото товара обязательно");
      return;
    }

    setIsSubmitting(true);
    try {
      let fileForUpload: File | Blob = imageFile;
      try {
        fileForUpload = await imageCompression(imageFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      } catch {
        // keep original file when compression fails
      }

      const imageUrl = await uploadProductImage(fileForUpload);

      await createProduct({
        name: name.trim(),
        quantity: qtyInt,
        unit,
        salePrice: sale > 0 ? sale.toFixed(2) : undefined,
        // Fixed delivery goes to costPrice; per-kg goes to pricePerKg.
        pricePerKg: deliveryMode === "per_kg" && delivery > 0 ? delivery.toFixed(2) : undefined,
        costPrice: deliveryMode === "fixed" && delivery > 0 ? delivery.toFixed(2) : undefined,
        tripId,
        shopId: shopId !== NO_SHOP_VALUE ? shopId : undefined,
        imageUrl,
        description: description.trim() || undefined,
      });

      toast.success("Товар добавлен");
      router.push("/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return <div className="py-12 text-center text-muted-foreground">Загрузка...</div>;
  }

  if (dataError) {
    return (
      <div className="space-y-4 pb-20">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {dataError}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Повторить
        </Button>
      </div>
    );
  }

  const canSubmit = !!imageFile && !!name.trim() && qtyInt > 0 && !!tripId && !isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormCard>
        <FormSection title="Фото">
          <div className="space-y-2 px-4 pb-4">
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl">
                <img src={imagePreview} alt="Превью товара" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50"
                >
                  <X className="size-3.5 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageSelect}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleImageSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-[44px] flex-1 rounded-xl text-[15px]"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" /> Галерея
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-[44px] flex-1 rounded-xl text-[15px]"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="size-4" /> Камера
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Фото обязательно</p>
          </div>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection>
          <FormRow label="Название">
            <Input
              placeholder="Название товара"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormRow>

          <FormRow label="Описание (необязательно)">
            <Textarea
              placeholder="Описание товара"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none rounded-xl"
            />
          </FormRow>

          <div className="grid grid-cols-2 gap-3 px-4 py-3">
            <div>
              <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Количество
              </p>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Единица
              </p>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FormRow label="Цена товара ($)">
            <Input
              type="number"
              step="0.01"
              placeholder="60"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </FormRow>

          <FormRow label="Тип цены доставки">
            <Select value={deliveryMode} onValueChange={(v) => setDeliveryMode(v as DeliveryMode)}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_kg">За кг</SelectItem>
                <SelectItem value="fixed">Фиксированная цена</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>

          <FormRow label={deliveryMode === "per_kg" ? "Цена доставки за кг ($)" : "Фиксированная цена доставки ($)"}>
            <Input
              type="number"
              step="0.01"
              placeholder={deliveryMode === "per_kg" ? "8" : "25"}
              value={deliveryPrice}
              onChange={(e) => setDeliveryPrice(e.target.value)}
            />
          </FormRow>

          <p className="px-4 pb-2 text-xs text-muted-foreground">
            Расчет по кг выполняется всегда как: количество × цена за кг (даже если единица не “кг”).
          </p>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection>
          <FormRow label="Поездка">
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder="Выберите поездку" />
              </SelectTrigger>
              <SelectContent>
                {activeTrips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>

          <FormRow label="Магазин (необязательно)">
            <Select
              value={shopId}
              onValueChange={setShopId}
              onOpenChange={(isOpen) => {
                if (!isOpen) setShopSearch("");
              }}
            >
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder="Выберите магазин" />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-20 border-b bg-popover p-2">
                  <Input
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Поиск магазина..."
                    className="h-9 rounded-lg"
                  />
                </div>
                <SelectItem value={NO_SHOP_VALUE}>Не привязан</SelectItem>
                {filteredShops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
                {filteredShops.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Ничего не найдено</div>
                ) : null}
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection title="Расчеты">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
            <div className="px-3 pb-2">
              <CalcRow label="Количество" value={qty > 0 ? `${qty} ${unit}` : "—"} />
              <CalcRow label="Цена товара за 1 ед" value={sale > 0 ? `${sale.toFixed(2)} $` : "—"} />
              <CalcRow
                label="Итого товар"
                formula={`Количество × Цена = ${qty > 0 ? qty : "—"} × ${sale > 0 ? sale.toFixed(2) : "—"}`}
                value={formatMoney(totalSale)}
                highlight
              />

              <div className="border-t border-border/60" />

              <CalcRow
                label={deliveryMode === "per_kg" ? "Цена доставки за кг" : "Фиксированная доставка"}
                value={delivery > 0 ? `${delivery.toFixed(2)} $` : "—"}
              />
              <CalcRow
                label="Итого доставка"
                formula={
                  deliveryMode === "per_kg"
                    ? `Количество × Цена за кг = ${qty > 0 ? qty : "—"} × ${delivery > 0 ? delivery.toFixed(2) : "—"}`
                    : "Фиксированная стоимость"
                }
                value={formatMoney(totalDelivery)}
              />

              <div className="border-t border-border/60" />
              <CalcRow label="Общий итог" value={formatMoney(totalFinal)} highlight />
            </div>
          </div>
        </FormSection>
      </FormCard>

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {isSubmitting ? "Сохранение..." : "Добавить товар"}
      </Button>
    </form>
  );
}
