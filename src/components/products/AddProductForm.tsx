"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import imageCompression from "browser-image-compression";
import { ImagePlus, Camera, X, Package, Plus } from "lucide-react";
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
import {
  FormCard,
  FormRow,
  FormSection,
  FormHero,
  FormMetaPill,
} from "@/components/ui/form-helpers";

import { createProduct } from "@/lib/api/products";
import { getTrips } from "@/lib/api/trips";
import { getShops } from "@/lib/api/shops";
import { uploadProductImage } from "@/lib/api/storage";
import type { Shop, Trip } from "@/types";
import { useTranslations } from "@/lib/useTranslations";
import { clearLocalDraft, readLocalDraft, writeLocalDraft } from "@/lib/local-draft";
import { getLocalizedProductUnit, getProductUnitOptions, PRODUCT_UNIT_VALUES } from "@/lib/product-units";

const NO_SHOP_VALUE = "none";
const MAX_PRODUCT_IMAGES = 15;

type DeliveryMode = "per_kg" | "fixed";

function formatMoney(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(2)} $`;
}

function formatKgValue(value: string): string {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return value;
  return parsed.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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
  const { t } = useTranslations();

  const tripIdFromUrl = searchParams.get("tripId") ?? "";
  const shopIdFromUrl = searchParams.get("shopId") ?? "";

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>(PRODUCT_UNIT_VALUES[0]);
  const [salePrice, setSalePrice] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("per_kg");
  const [deliveryPrice, setDeliveryPrice] = useState("");
  const [deliveryKgInput, setDeliveryKgInput] = useState("");
  const [deliveryKgValues, setDeliveryKgValues] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [tripId, setTripId] = useState(tripIdFromUrl);
  const [shopId, setShopId] = useState(shopIdFromUrl || NO_SHOP_VALUE);
  const [shopSearch, setShopSearch] = useState("");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [draftRecovered, setDraftRecovered] = useState(false);
  const [draftImagesNeedReselect, setDraftImagesNeedReselect] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const draftKey = `product:new:${tripIdFromUrl || "no-trip"}:${shopIdFromUrl || "no-shop"}`;
  const unitOptions = useMemo(() => getProductUnitOptions(t), [t]);

  useEffect(() => {
    setLoadingData(true);
    setDataError(null);
    Promise.all([getTrips(1, 50), getShops(1, 100)])
      .then(([tripsRes, shopsRes]) => {
        setTrips(tripsRes.trips);
        setShops(shopsRes.shops);
      })
      .catch((e) => setDataError(e instanceof Error ? e.message : t("common.loadError")))
      .finally(() => setLoadingData(false));
  }, [t]);

  useEffect(() => {
    if (tripIdFromUrl) setTripId(tripIdFromUrl);
    setShopId(shopIdFromUrl || NO_SHOP_VALUE);
  }, [tripIdFromUrl, shopIdFromUrl]);

  useEffect(() => {
    const draft = readLocalDraft<{
      name: string;
      quantity: string;
      unit: string;
      salePrice: string;
      deliveryMode: DeliveryMode;
      deliveryPrice: string;
      deliveryKgInput: string;
      deliveryKgValues: string[];
      description: string;
      tripId: string;
      shopId: string;
      imagePreviews: string[];
      imagesNeedReselect: boolean;
    }>(draftKey);
    if (!draft) return;

    setName(draft.name);
    setQuantity(draft.quantity);
    setUnit(draft.unit);
    setSalePrice(draft.salePrice);
    setDeliveryMode(draft.deliveryMode);
    setDeliveryPrice(draft.deliveryPrice);
    setDeliveryKgInput(draft.deliveryKgInput);
    setDeliveryKgValues(draft.deliveryKgValues ?? []);
    setDescription(draft.description);
    setTripId(draft.tripId || tripIdFromUrl);
    setShopId(draft.shopId || shopIdFromUrl || NO_SHOP_VALUE);
    setImagePreviews(draft.imagePreviews ?? []);
    setDraftImagesNeedReselect(Boolean(draft.imagesNeedReselect));
    setDraftRecovered(true);
  }, [draftKey, shopIdFromUrl, tripIdFromUrl]);

  useEffect(() => {
    writeLocalDraft(draftKey, {
      name,
      quantity,
      unit,
      salePrice,
      deliveryMode,
      deliveryPrice,
      deliveryKgInput,
      deliveryKgValues,
      description,
      tripId,
      shopId,
      imagePreviews,
      imagesNeedReselect: imagePreviews.length > 0 && imageFiles.length === 0,
    });
  }, [
    deliveryMode,
    deliveryPrice,
    deliveryKgInput,
    deliveryKgValues,
    description,
    draftKey,
    imageFiles,
    imagePreviews,
    name,
    quantity,
    salePrice,
    shopId,
    tripId,
    unit,
  ]);

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
  const deliveryWeight = deliveryKgValues.reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0);

  const totalSale = sale > 0 ? sale : null;
  const totalDelivery = delivery > 0
    ? deliveryMode === "per_kg"
      ? deliveryWeight > 0
        ? delivery * deliveryWeight
        : null
      : delivery
    : null;
  const totalFinal = totalSale !== null || totalDelivery !== null
    ? (totalSale ?? 0) + (totalDelivery ?? 0)
    : null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    e.target.value = "";
    if (selectedFiles.length === 0) return;

    const availableSlots = draftImagesNeedReselect ? MAX_PRODUCT_IMAGES : MAX_PRODUCT_IMAGES - imagePreviews.length;
    if (availableSlots <= 0) {
      toast.error(t("products.photoLimitReached"));
      return;
    }

    const nextFiles = selectedFiles.slice(0, availableSlots);
    if (selectedFiles.length > availableSlots) {
      toast.error(t("products.photoLimitExceeded"));
    }

    const nextPreviews = await Promise.all(nextFiles.map((file) => readFileAsDataUrl(file)));

    setImageFiles((prev) => (draftImagesNeedReselect ? nextFiles : [...prev, ...nextFiles].slice(0, MAX_PRODUCT_IMAGES)));
    setImagePreviews((prev) => (draftImagesNeedReselect ? nextPreviews : [...prev, ...nextPreviews].slice(0, MAX_PRODUCT_IMAGES)));
    setDraftImagesNeedReselect(false);
  };

  const removeImage = (index: number) => {
    const nextPreviews = imagePreviews.filter((_, itemIndex) => itemIndex !== index);
    setImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setImagePreviews(nextPreviews);
    if (nextPreviews.length === 0) {
      setDraftImagesNeedReselect(false);
    }
  };

  const handleAddDeliveryKg = () => {
    const parsedValue = Number.parseFloat(deliveryKgInput);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      toast.error(t("products.deliveryKgInvalid"));
      return;
    }
    setDeliveryKgValues((prev) => [...prev, parsedValue.toFixed(2)]);
    setDeliveryKgInput("");
  };

  const removeDeliveryKg = (index: number) => {
    setDeliveryKgValues((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || qtyInt <= 0 || !tripId) {
      toast.error(t("products.formRequired"));
      return;
    }
    if (deliveryMode === "per_kg" && delivery > 0 && deliveryWeight <= 0) {
      toast.error(t("products.deliveryKg"));
      return;
    }
    if (imageFiles.length === 0) {
      toast.error(
        draftImagesNeedReselect
          ? t("products.reselectPhotos")
          : t("products.photoRequired")
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const imageFile of imageFiles) {
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
        imageUrls.push(await uploadProductImage(fileForUpload));
      }

      await createProduct({
        name: name.trim(),
        quantity: qtyInt,
        unit,
        deliveryKgValues: deliveryMode === "per_kg" ? deliveryKgValues : [],
        deliveryKg: deliveryMode === "per_kg" && deliveryWeight > 0 ? deliveryWeight.toFixed(2) : undefined,
        salePrice: sale > 0 ? sale.toFixed(2) : undefined,
        // Fixed delivery goes to costPrice; per-kg goes to pricePerKg.
        pricePerKg: deliveryMode === "per_kg" && delivery > 0 ? delivery.toFixed(2) : undefined,
        costPrice: deliveryMode === "fixed" && delivery > 0 ? delivery.toFixed(2) : undefined,
        tripId,
        shopId: shopId !== NO_SHOP_VALUE ? shopId : undefined,
        imageUrl: imageUrls[0],
        imageUrls,
        description: description.trim() || undefined,
      });

      clearLocalDraft(draftKey);
      toast.success(t("products.created"));
      router.push("/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>;
  }

  if (dataError) {
    return (
      <div className="space-y-4 pb-20">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {dataError}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const canSubmit = imageFiles.length > 0 && !!name.trim() && qtyInt > 0 && !!tripId && !isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <FormHero
        icon={<Package className="size-5" />}
        title={t("titles.newProduct")}
        description={t("products.formHeroDescription")}
        meta={
          <>
            <FormMetaPill label={t("products.formProduct")} value={name.trim() || "—"} />
            <FormMetaPill
              label={t("products.formQuantity")}
              value={qtyInt > 0 ? `${qtyInt} ${getLocalizedProductUnit(t, unit)}` : "—"}
            />
            <FormMetaPill label={t("products.formTotal")} value={formatMoney(totalFinal)} />
          </>
        }
      />

      <FormCard>
        <FormSection title={t("products.photoSection")}>
          <div className="space-y-2 px-4 pb-4">
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
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

            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={`${preview.slice(0, 40)}-${index}`} className="relative overflow-hidden rounded-[20px] border border-white/8">
                    <img src={preview} alt={`${t("products.photoPreview")} ${index + 1}`} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50"
                    >
                      <X className="size-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {imagePreviews.length < MAX_PRODUCT_IMAGES ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-[44px] flex-1 rounded-[20px] text-[15px]"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" /> {t("profile.gallery")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-[44px] flex-1 rounded-[20px] text-[15px]"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="size-4" /> {t("profile.camera")}
                </Button>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              {draftRecovered ? t("products.draftRecovered") : t("products.photoRequiredHint")} {t("products.photoLimitHint")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("products.photoCount").replace("{{count}}", String(imagePreviews.length)).replace("{{max}}", String(MAX_PRODUCT_IMAGES))}
            </p>
            {draftImagesNeedReselect ? (
              <p className="text-xs text-amber-400">{t("products.reselectPhotosHint")}</p>
            ) : null}
          </div>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection>
          <FormRow label={t("products.formName")}>
            <Input
              placeholder={t("products.formNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormRow>

          <FormRow label={t("products.formDescription")}>
            <Textarea
              placeholder={t("products.formDescriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none rounded-xl"
            />
          </FormRow>

          <div className="grid grid-cols-2 gap-3 px-4 py-3">
            <div>
              <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {t("products.formQuantity")}
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
                {t("products.formUnit")}
              </p>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FormRow label={t("products.formSalePrice")}>
            <Input
              type="number"
              step="0.01"
              placeholder="60"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </FormRow>

          <FormRow label={t("products.deliveryType")}>
            <Select value={deliveryMode} onValueChange={(v) => setDeliveryMode(v as DeliveryMode)}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_kg">{t("products.deliveryPerKg")}</SelectItem>
                <SelectItem value="fixed">{t("products.deliveryFixed")}</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>

          <FormRow label={deliveryMode === "per_kg" ? t("products.deliveryPricePerKg") : t("products.deliveryPriceFixed")}>
            <Input
              type="number"
              step="0.01"
              placeholder={deliveryMode === "per_kg" ? "8" : "25"}
              value={deliveryPrice}
              onChange={(e) => setDeliveryPrice(e.target.value)}
            />
          </FormRow>

          {deliveryMode === "per_kg" ? (
            <>
              <FormRow label={t("products.deliveryKg")}>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t("products.deliveryKgInputPlaceholder")}
                    value={deliveryKgInput}
                    onChange={(e) => setDeliveryKgInput(e.target.value)}
                  />
                  <Button type="button" variant="outline" className="rounded-xl px-4" onClick={handleAddDeliveryKg}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </FormRow>

              <div className="px-4 pb-3">
                <p className="mb-2 text-xs text-muted-foreground">{t("products.deliveryKgBatchHint")}</p>
                {deliveryKgValues.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {deliveryKgValues.map((value, index) => (
                      <div
                        key={`${value}-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/40 px-3 py-1.5 text-sm"
                      >
                        <span>+{formatKgValue(value)} {t("products.defaultKg")}</span>
                        <button type="button" onClick={() => removeDeliveryKg(index)} className="text-muted-foreground transition-colors hover:text-foreground">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("products.deliveryKgEmpty")}</p>
                )}
              </div>
            </>
          ) : null}

          <p className="px-4 pb-2 text-xs text-muted-foreground">
            {t("products.deliveryHint")}
          </p>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection>
          <FormRow label={t("titles.trip")}>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder={t("products.selectTrip")} />
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

          <FormRow label={t("products.optionalShop")}>
            <Select
              value={shopId}
              onValueChange={setShopId}
              onOpenChange={(isOpen) => {
                if (!isOpen) setShopSearch("");
              }}
            >
              <SelectTrigger className="h-[44px] rounded-xl border-border bg-muted/50 text-[16px]">
                <SelectValue placeholder={t("shops.selectShop")} />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-20 border-b bg-popover p-2">
                  <Input
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder={t("products.searchShopPlaceholder")}
                    className="h-9 rounded-lg"
                  />
                </div>
                <SelectItem value={NO_SHOP_VALUE}>{t("products.notLinked")}</SelectItem>
                {filteredShops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
                {filteredShops.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{t("shops.emptyFilteredTitle")}</div>
                ) : null}
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>
      </FormCard>

      <FormCard>
        <FormSection title={t("products.calculationsTitle")}>
          <div className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03]">
            <div className="px-3 pb-2">
              <CalcRow
                label={t("products.formQuantity")}
                value={qty > 0 ? `${qty} ${getLocalizedProductUnit(t, unit)}` : "—"}
              />
              <CalcRow label={t("products.unitPriceRow")} value={sale > 0 ? `${sale.toFixed(2)} $` : "—"} />
              <CalcRow
                label={t("products.totalProduct")}
                formula={sale > 0 ? t("products.totalPriceFormula") : undefined}
                value={formatMoney(totalSale)}
                highlight
              />

              <div className="border-t border-border/60" />

              <CalcRow
                label={deliveryMode === "per_kg" ? t("products.deliveryPricePerKgShort") : t("products.deliveryFixedShort")}
                value={delivery > 0 ? `${delivery.toFixed(2)} $` : "—"}
              />
              {deliveryMode === "per_kg" ? (
                <CalcRow
                  label={t("products.deliveryKgShort")}
                  value={deliveryWeight > 0 ? `${deliveryWeight.toFixed(2)} ${t("products.defaultKg")}` : "—"}
                />
              ) : null}
              <CalcRow
                label={t("products.totalDelivery")}
                formula={
                  deliveryMode === "per_kg"
                    ? `${deliveryKgValues.length > 0 ? deliveryKgValues.map((value) => formatKgValue(value)).join(" + ") : "—"} × ${t("products.deliveryPerKg")} = ${deliveryWeight > 0 ? deliveryWeight.toFixed(2) : "—"} × ${delivery > 0 ? delivery.toFixed(2) : "—"}`
                    : t("products.deliveryFixed")
                }
                value={formatMoney(totalDelivery)}
              />

              <div className="border-t border-border/60" />
              <CalcRow label={t("products.formTotal")} value={formatMoney(totalFinal)} highlight />
            </div>
          </div>
        </FormSection>
      </FormCard>

      <Button type="submit" className="h-12 w-full rounded-[22px]" disabled={!canSubmit}>
        {isSubmitting ? t("products.savingProduct") : t("products.createAction")}
      </Button>
    </form>
  );
}
