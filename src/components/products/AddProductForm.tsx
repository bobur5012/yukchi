"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PRODUCT_UNITS } from "@/lib/constants";
import type { Trip } from "@/types";
import { toast } from "sonner";
import { FormCard, FormRow, FormSection } from "@/components/ui/form-helpers";

const UNITS_DISPLAY: Record<string, string> = {
  шт: "ШТ",
  кг: "КГ",
  м: "М",
  л: "Л",
  упак: "УПАК",
};

export function AddProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>(PRODUCT_UNITS[0]);
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [tripId, setTripId] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    getTrips(1, 50).then((r) => setTrips(r.trips));
  }, []);

  const q = parseInt(quantity, 10) || 1;
  const cp = parseFloat(costPrice) || 0;
  const sp = parseFloat(salePrice) || 0;
  const ppk = parseFloat(pricePerKg) || 0;

  const totalCostPrice = (q * cp).toFixed(2);
  const totalSalePrice = sp > 0 ? (q * sp).toFixed(2) : null;
  const totalPricePerKg = ppk > 0 && (unit === "кг" || unit === "л") ? (q * ppk).toFixed(2) : null;
  const margin = sp > 0 && cp > 0 ? (sp - cp).toFixed(2) : null;

  const activeTrips = trips.filter((t) => t.status === "active" || t.status === "planned");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || cp <= 0 || q <= 0 || !tripId) {
      toast.error("Заполните название, количество, цену себестоимости и поездку");
      return;
    }
    try {
      await createProduct({
        name: name.trim(),
        quantity: q,
        unit: unit,
        costPrice: cp.toFixed(2),
        salePrice: sp > 0 ? sp.toFixed(2) : undefined,
        pricePerKg: ppk > 0 ? ppk.toFixed(2) : undefined,
        tripId,
        imageUrl: image || undefined,
      });
      toast.success("Товар добавлен");
      router.push("/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      {/* Photo */}
      <FormCard>
        <FormSection title="Фото">
          <div className="px-4 pb-4">
            {image ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={image} alt="Превью" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 size-7 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="size-3.5 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input ref={galleryInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleImageSelect} />
                <Button type="button" variant="outline" className="flex-1 h-[44px] rounded-xl text-[15px]" onClick={() => galleryInputRef.current?.click()}>
                  <ImagePlus className="size-4" /> Галерея
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-[44px] rounded-xl text-[15px]" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="size-4" /> Камера
                </Button>
              </div>
            )}
          </div>
        </FormSection>
      </FormCard>

      {/* Main fields */}
      <FormCard>
        <FormSection>
          <FormRow label="Название">
            <Input placeholder="Кожаная сумка" value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
          <div className="grid grid-cols-2 gap-3 px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em] mb-1.5">Количество</p>
              <Input type="number" min={1} placeholder="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em] mb-1.5">Единица</p>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{UNITS_DISPLAY[u] ?? u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <FormRow label="Цена себестоимости ($)">
            <Input type="number" step="0.01" placeholder="45" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          </FormRow>
          <FormRow label="Цена продажи ($)">
            <Input type="number" step="0.01" placeholder="60" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
          </FormRow>
          <FormRow label="Цена за кг ($)">
            <Input type="number" step="0.01" placeholder="5" value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} />
          </FormRow>
        </FormSection>
      </FormCard>

      {/* Trip */}
      <FormCard>
        <FormSection>
          <FormRow label="Поездка">
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder="Выберите поездку" />
              </SelectTrigger>
              <SelectContent>
                {activeTrips.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>
      </FormCard>

      {/* Calculations */}
      {(cp > 0 || sp > 0 || ppk > 0) && q > 0 && (
        <FormCard>
          <FormSection title="Расчёты">
            <div className="space-y-2 text-[15px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Общая стоимость товара</span>
                <span className="font-semibold tabular-nums">{totalCostPrice} $</span>
              </div>
              {totalSalePrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Общая цена продажи</span>
                  <span className="font-semibold tabular-nums text-emerald-500">{totalSalePrice} $</span>
                </div>
              )}
              {totalPricePerKg && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Общая цена за {unit}</span>
                  <span className="font-semibold tabular-nums">{totalPricePerKg} $</span>
                </div>
              )}
              {margin && (
                <div className="flex justify-between pt-2 border-t border-border/30">
                  <span className="text-muted-foreground">Маржа (за ед.)</span>
                  <span className="font-semibold tabular-nums text-primary">{margin} $</span>
                </div>
              )}
            </div>
          </FormSection>
        </FormCard>
      )}

      <Button type="submit" className="w-full" disabled={!name.trim() || cp <= 0 || q <= 0 || !tripId}>
        Добавить товар
      </Button>
    </form>
  );
}
