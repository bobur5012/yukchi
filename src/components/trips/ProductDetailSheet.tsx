"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Pencil, Trash2, Expand } from "lucide-react";
import type { Product, Shop, Trip } from "@/types";
import { getShops } from "@/lib/api/shops";
import { updateProduct, deleteProduct } from "@/lib/api/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import { useTranslations } from "@/lib/useTranslations";
import { toast } from "sonner";
import {
  getProductDeliveryKgValues,
  getProductDeliveryPerKgPrice,
  getProductDeliveryWeightValue,
  getProductFixedDeliveryPrice,
  getProductSalePrice,
  getProductTotalDelivery,
  getProductTotalSale,
} from "@/lib/product-math";
import { getLocalizedProductUnit } from "@/lib/product-units";
import { getProductResolvedImageUrls } from "@/lib/product-media";

interface ProductDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  trip?: Trip | null;
  courierName?: string;
  onProductUpdated?: (product: Product) => void;
  onProductDeleted?: () => void;
  canEdit?: boolean;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5">
      <p className="text-sm text-muted-foreground break-words">{label}</p>
      <p className="text-sm font-medium text-right break-words">{value}</p>
    </div>
  );
}

function formatCreatedAt(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProductDetailSheet({
  open,
  onOpenChange,
  product,
  trip,
  courierName,
  onProductUpdated,
  onProductDeleted,
  canEdit = true,
}: ProductDetailSheetProps) {
  const { formatAmount } = useFormattedAmount();
  const { t } = useTranslations();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<string | null>(product?.shopId ?? product?.shop?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (!open || !product) return;
    getShops(1, 100).then((r) => setShops(r.shops));
    setShopId(product.shopId ?? product.shop?.id ?? null);
    setEditName(product.name);
    setEditQuantity(String(product.quantity));
    setEditSalePrice(product.salePrice ?? "");
    setEditDescription(product.description ?? "");
    setPreviewIndex(0);
  }, [open, product]);

  const computed = useMemo(() => {
    if (!product) {
      return {
        quantity: 0,
        unit: t("products.defaultUnit"),
        deliveryWeight: 0,
        deliveryKgValues: [],
        sale: 0,
        fixedDelivery: 0,
        deliveryPerKg: 0,
        totalSale: 0,
        totalDelivery: 0,
        hasTotalSale: false,
        hasTotalDelivery: false,
      };
    }

    const quantity = product.quantity || 0;
    const unit = getLocalizedProductUnit(t, product.unit);
    const deliveryWeight = getProductDeliveryWeightValue(product);
    const deliveryKgValues = getProductDeliveryKgValues(product);
    const sale = getProductSalePrice(product);
    const fixedDelivery = getProductFixedDeliveryPrice(product);
    const deliveryPerKg = getProductDeliveryPerKgPrice(product);

    const totalSale = getProductTotalSale(product);
    const totalDelivery = getProductTotalDelivery(product);

    return {
      quantity,
      unit,
      deliveryWeight,
      deliveryKgValues,
      sale,
      fixedDelivery,
      deliveryPerKg,
      totalSale,
      totalDelivery,
      hasTotalSale: totalSale > 0,
      hasTotalDelivery: totalDelivery > 0,
    };
  }, [product, t]);

  const handleAttachShop = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const updated = await updateProduct(product.id, { shopId: shopId || null });
      onProductUpdated?.(updated);
      onOpenChange(false);
      toast.success(t("products.shopLinkUpdated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!product) return;
    const q = Number.parseInt(editQuantity, 10);
    if (!editName.trim() || Number.isNaN(q) || q < 1) {
      toast.error(t("products.formRequired"));
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProduct(product.id, {
        name: editName.trim(),
        quantity: q,
        salePrice: editSalePrice ? Number.parseFloat(editSalePrice).toFixed(2) : undefined,
        description: editDescription.trim() || undefined,
      });
      onProductUpdated?.(updated);
      setEditing(false);
      toast.success(t("products.updated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      onProductDeleted?.();
      setDeleteConfirmOpen(false);
      onOpenChange(false);
      toast.success(t("products.deleted"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setDeleting(false);
    }
  };

  if (!product) return null;

  const imageUrls = getProductResolvedImageUrls(product);
  const imageSrc = imageUrls[previewIndex] ?? imageUrls[0];
  const deliveryModeLabel = computed.deliveryPerKg > 0 ? t("products.deliveryPerKg") : computed.fixedDelivery > 0 ? t("products.deliveryFixedShort") : "—";
  const deliveryPriceLabel = computed.deliveryPerKg > 0
    ? `${formatAmount(computed.deliveryPerKg)} / ${t("products.defaultKg")}`
    : computed.fixedDelivery > 0
      ? formatAmount(computed.fixedDelivery)
      : "—";

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditing(false);
            setPreviewOpen(false);
          }
          onOpenChange(nextOpen);
        }}
      >
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-[30px] border-t border-white/10 bg-[linear-gradient(180deg,rgba(28,28,34,0.98)_0%,rgba(16,16,20,0.96)_100%)] shadow-[0_-18px_44px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <SheetHeader className="flex-row items-center justify-between gap-2">
            <SheetTitle className="truncate">{product.name}</SheetTitle>
            {canEdit && (
              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <Button size="sm" variant="outline" className="rounded-[18px]" onClick={() => setEditing(false)} disabled={saving}>
                      {t("common.cancel")}
                    </Button>
                    <Button size="sm" className="rounded-[18px]" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? "..." : t("common.save")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" className="rounded-[18px]" onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-[18px] text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            {imageSrc ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="relative block w-full overflow-hidden rounded-[24px] border border-white/8 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="h-52 w-full object-cover"
                />
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] text-white">
                  <Expand className="h-3 w-3" />
                  {t("products.zoomImage")}
                </span>
              </button>
            ) : (
              <div className="flex h-44 items-center justify-center rounded-[24px] border border-white/8 bg-muted">
                <Package className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}

            {imageUrls.length > 1 ? (
              <div className="grid grid-cols-4 gap-2">
                {imageUrls.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className={`overflow-hidden rounded-[16px] border ${previewIndex === index ? "border-primary" : "border-white/8"}`}
                  >
                    <img src={url} alt={`${product.name} ${index + 1}`} className="h-16 w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            {editing ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1.5">{t("products.formName")}</p>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1.5">{t("products.formQuantity")}</p>
                  <Input type="number" min={1} value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1.5">{t("products.formSalePrice")}</p>
                  <Input
                    type="number"
                    step="0.01"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(e.target.value)}
                    className="rounded-xl"
                    placeholder="60"
                  />
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1.5">{t("products.formDescription")}</p>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-3">
                <InfoRow label={t("products.formName")} value={product.name} />
                <div className="border-t border-border/50" />
                <InfoRow label={t("products.formQuantity")} value={`${computed.quantity} ${computed.unit}`} />
                <div className="border-t border-border/50" />
                <InfoRow
                  label={t("products.formSalePrice")}
                  value={computed.sale > 0 ? formatAmount(computed.sale) : "—"}
                />
                <div className="border-t border-border/50" />
                <InfoRow
                  label={t("products.totalProduct")}
                  value={computed.hasTotalSale ? formatAmount(computed.totalSale) : "—"}
                />
                <div className="border-t border-border/50" />
                {computed.deliveryPerKg > 0 ? (
                  <>
                    <InfoRow
                      label={t("products.deliveryKg")}
                      value={computed.deliveryWeight > 0 ? `${computed.deliveryWeight.toFixed(2)} ${t("products.defaultKg")}` : "—"}
                    />
                    {computed.deliveryKgValues.length > 0 ? (
                      <>
                        <div className="border-t border-border/50" />
                        <InfoRow
                          label={t("products.deliveryKgShort")}
                          value={computed.deliveryKgValues.map((value) => `+${value.toFixed(2)} ${t("products.defaultKg")}`).join(", ")}
                        />
                      </>
                    ) : null}
                    <div className="border-t border-border/50" />
                  </>
                ) : null}
                <InfoRow label={`${t("products.delivery")} (${deliveryModeLabel})`} value={deliveryPriceLabel} />
                <div className="border-t border-border/50" />
                <InfoRow
                  label={t("products.totalDelivery")}
                  value={computed.hasTotalDelivery ? formatAmount(computed.totalDelivery) : "—"}
                />
                <div className="border-t border-border/50" />
                <InfoRow label={t("products.createdAt")} value={formatCreatedAt(product.createdAt)} />
                <div className="border-t border-border/50" />
                <InfoRow label={t("titles.shop")} value={product.shop?.name || "—"} />
                <div className="border-t border-border/50" />
                <InfoRow label={t("titles.trip")} value={trip?.name || "—"} />
                {courierName ? (
                  <>
                    <div className="border-t border-border/50" />
                    <InfoRow label={t("common.courier")} value={courierName} />
                  </>
                ) : null}
              </div>
            )}

            {!editing && product.description ? (
              <div>
                <p className="text-[13px] text-muted-foreground mb-1">{t("products.formDescription")}</p>
                <p className="text-[15px] text-foreground whitespace-pre-wrap break-words">{product.description}</p>
              </div>
            ) : null}

            {!editing && (
              <div>
                <p className="text-[13px] text-muted-foreground mb-2">{t("products.linkToShop")}</p>
                <div className="flex gap-2">
                  <Select
                    value={shopId ?? "none"}
                    onValueChange={(v) => setShopId(v === "none" ? null : v)}
                  >
                  <SelectTrigger className="rounded-[18px]">
                      <SelectValue placeholder={t("shops.selectShop")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("products.notLinked")}</SelectItem>
                      {shops.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="rounded-[18px]"
                    onClick={handleAttachShop}
                    disabled={saving || (shopId ?? "none") === (product.shopId ?? product.shop?.id ?? "none")}
                  >
                    {saving ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("products.linkHint")}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] p-2 sm:max-w-4xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("products.photoSection")}</DialogTitle>
          </DialogHeader>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{t("products.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("products.deleteDescription").replace("{{name}}", product.name)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("products.deleting") : t("products.deleteAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
