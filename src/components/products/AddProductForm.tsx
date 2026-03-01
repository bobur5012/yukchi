"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Camera, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import { uploadProductImage } from "@/lib/api/storage";
import { getShops } from "@/lib/api/shops";
import { PRODUCT_UNITS } from "@/lib/constants";
import type { Trip, Shop } from "@/types";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

const NO_SHOP_VALUE = "none";

const UNITS_DISPLAY: Record<string, string> = {
  "С€С‚": "ШТ",
  "РєРі": "КГ",
  "Рј": "М",
  "Р»": "Л",
  "СѓРїР°Рє": "УПАК",
};

function isWeightUnit(unit: string): boolean {
  const v = unit.toLowerCase();
  return v === "кг" || v === "л" || v === "рєрг" || v === "р»";
}

function fmtMoney(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(2)} $`;
}

export function AddProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tripIdFromUrl = searchParams.get("tripId") ?? "";
  const shopIdFromUrl = searchParams.get("shopId") ?? "";

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>(PRODUCT_UNITS[0]);
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [tripId, setTripId] = useState(tripIdFromUrl);
  const [shopId, setShopId] = useState(shopIdFromUrl || NO_SHOP_VALUE);
  const [description, setDescription] = useState("");
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

  const activeTrips = useMemo(
    () => trips.filter((t) => t.status === "active" || t.status === "planned"),
    [trips]
  );

  const filteredShops = useMemo(() => {
    const needle = shopSearch.trim().toLowerCase();
    if (!needle) return shops;
    return shops.filter((s) => s.name.toLowerCase().includes(needle));
  }, [shops, shopSearch]);

  const quantityValue = Number.parseFloat(quantity);
  const q = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 0;
  const qInt = Number.isInteger(quantityValue) ? quantityValue : Math.trunc(quantityValue);

  const cp = Number.parseFloat(costPrice) || 0;
  const sp = Number.parseFloat(salePrice) || 0;
  const ppk = Number.parseFloat(pricePerKg) || 0;

  const totalCost = cp > 0 && q > 0 ? cp * q : null;
  const totalSale = sp > 0 && q > 0 ? sp * q : null;
  const margin = totalCost !== null && totalSale !== null ? totalSale - totalCost : null;
  const totalByKg = isWeightUnit(unit) && ppk > 0 && q > 0 ? ppk * q : null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
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

    if (!name.trim() || qInt <= 0 || !tripId) {
      toast.error("Заполните название, количество и поездку");
      return;
    }
    if (!imageFile) {
      toast.error("Фото товара обязательно");
      return;
    }

    setIsSubmitting(true);
    try {
      const compressed = await imageCompression(imageFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      const imageUrl = await uploadProductImage(compressed);

      await createProduct({
        name: name.trim(),
        quantity: qInt,
        unit,
        costPrice: cp > 0 ? cp.toFixed(2) : undefined,
        salePrice: sp > 0 ? sp.toFixed(2) : undefined,
        pricePerKg: ppk > 0 ? ppk.toFixed(2) : undefined,
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

  const canSubmit = !!imageFile && !!name.trim() && qInt > 0 && !!tripId && !isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormCard>
        <FormSection title="Фото">
          <div className="px-4 pb-4 space-y-2">
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl">
                <img src={imagePreview} alt="Превью товара" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/50"
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
              placeholder="Кожаная сумка"
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
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNITS_DISPLAY[u] ?? u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FormRow label="Закупочная цена ($)">
            <Input
              type="number"
              step="0.01"
              placeholder="45"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </FormRow>

          <FormRow label="Цена продажи ($)">
            <Input
              type="number"
              step="0.01"
              placeholder="60"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </FormRow>

          <FormRow label="Цена за кг ($)">
            <Input
              type="number"
              step="0.01"
              placeholder="5"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Для расчета по кг заполните цену за кг и количество в кг/л
            </p>
          </FormRow>
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
                {activeTrips.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>

          <FormRow label="Магазин (необязательно)">
            <Select
              value={shopId}
              onValueChange={setShopId}
              onOpenChange={(open) => {
                if (!open) setShopSearch("");
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
                {filteredShops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
                {filteredShops.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Ничего не найдено</div>
                )}
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection title="Расчеты">
          <div className="space-y-2 text-[15px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Количество</span>
              <span className="font-medium">{q > 0 ? `${q} ${unit}` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Закуп за 1 ед</span>
              <span className="font-medium">{cp > 0 ? `${cp.toFixed(2)} $` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Продажа за 1 ед</span>
              <span className="font-medium">{sp > 0 ? `${sp.toFixed(2)} $` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Итого закуп = {q > 0 ? `${q}` : "—"} × {cp > 0 ? cp.toFixed(2) : "—"}
              </span>
              <span className="font-semibold">{fmtMoney(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Итого продажа = {q > 0 ? `${q}` : "—"} × {sp > 0 ? sp.toFixed(2) : "—"}
              </span>
              <span className="font-semibold text-emerald-500">{fmtMoney(totalSale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Маржа = Итого продажа - Итого закуп</span>
              <span className="font-semibold">{fmtMoney(margin)}</span>
            </div>
            <div className="mt-3 border-t border-border/50 pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Цена за кг</span>
                <span className="font-medium">{ppk > 0 ? `${ppk.toFixed(2)} $` : "—"}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Итого по кг = {q > 0 ? `${q}` : "—"} × {ppk > 0 ? ppk.toFixed(2) : "—"}</span>
                <span className="font-semibold">{fmtMoney(totalByKg)}</span>
              </div>
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
