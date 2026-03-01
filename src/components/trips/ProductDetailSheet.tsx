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
import { toast } from "sonner";

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
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<string | null>(product?.shopId ?? product?.shop?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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
  }, [open, product]);

  const computed = useMemo(() => {
    if (!product) {
      return {
        quantity: 0,
        unit: "шт",
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
    const unit = product.unit || "шт";
    const sale = toNum(product.salePrice ?? product.salePriceUsd);
    const fixedDelivery = toNum(product.costPrice ?? product.costPriceUsd);
    const deliveryPerKg = toNum(product.pricePerKg ?? product.pricePerKgUsd);

    const totalSale = sale > 0 ? sale * quantity : 0;
    const totalDelivery = deliveryPerKg > 0
      ? deliveryPerKg * quantity
      : fixedDelivery > 0
        ? fixedDelivery
        : 0;

    return {
      quantity,
      unit,
      sale,
      fixedDelivery,
      deliveryPerKg,
      totalSale,
      totalDelivery,
      hasTotalSale: totalSale > 0,
      hasTotalDelivery: totalDelivery > 0,
    };
  }, [product]);

  const handleAttachShop = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const updated = await updateProduct(product.id, { shopId: shopId || null });
      onProductUpdated?.(updated);
      onOpenChange(false);
      toast.success("Привязка магазина обновлена");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!product) return;
    const q = Number.parseInt(editQuantity, 10);
    if (!editName.trim() || Number.isNaN(q) || q < 1) {
      toast.error("Заполните название и количество");
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
      toast.success("Товар обновлен");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
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
      toast.success("Товар удален");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setDeleting(false);
    }
  };

  if (!product) return null;

  const imageSrc = withVersion(product.imageUrl, `${product.id}-${product.createdAt ?? "1"}`);
  const deliveryModeLabel = computed.deliveryPerKg > 0 ? "За кг" : computed.fixedDelivery > 0 ? "Фикс" : "—";
  const deliveryPriceLabel = computed.deliveryPerKg > 0
    ? `${formatAmount(computed.deliveryPerKg)} / кг`
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
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto">
          <SheetHeader className="flex-row items-center justify-between gap-2">
            <SheetTitle className="truncate">{product.name}</SheetTitle>
            {canEdit && (
              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                      Отмена
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? "..." : "Сохранить"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
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
                className="relative block w-full overflow-hidden rounded-xl border border-border/60 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="h-52 w-full object-cover"
                />
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] text-white">
                  <Expand className="h-3 w-3" />
                  Увеличить
                </span>
              </button>
            ) : (
              <div className="h-44 rounded-xl border border-border/60 bg-muted flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}

            {editing ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1.5">Название</p>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1.5">Количество</p>
                  <Input type="number" min={1} value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1.5">Цена товара ($)</p>
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
                  <p className="text-[13px] text-muted-foreground mb-1.5">Описание</p>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                <InfoRow label="Название" value={product.name} />
                <div className="border-t border-border/50" />
                <InfoRow label="Количество" value={`${computed.quantity} ${computed.unit}`} />
                <div className="border-t border-border/50" />
                <InfoRow
                  label="Цена товара"
                  value={computed.sale > 0 ? formatAmount(computed.sale) : "—"}
                />
                <div className="border-t border-border/50" />
                <InfoRow
                  label="Общая цена товара"
                  value={computed.hasTotalSale ? formatAmount(computed.totalSale) : "—"}
                />
                <div className="border-t border-border/50" />
                <InfoRow label={`Доставка (${deliveryModeLabel})`} value={deliveryPriceLabel} />
                <div className="border-t border-border/50" />
                <InfoRow
                  label="Общая доставка"
                  value={computed.hasTotalDelivery ? formatAmount(computed.totalDelivery) : "—"}
                />
                <div className="border-t border-border/50" />
                <InfoRow label="Время создания" value={formatCreatedAt(product.createdAt)} />
                <div className="border-t border-border/50" />
                <InfoRow label="Магазин" value={product.shop?.name || "—"} />
                <div className="border-t border-border/50" />
                <InfoRow label="Поездка" value={trip?.name || "—"} />
                {courierName ? (
                  <>
                    <div className="border-t border-border/50" />
                    <InfoRow label="Курьер" value={courierName} />
                  </>
                ) : null}
              </div>
            )}

            {!editing && product.description ? (
              <div>
                <p className="text-[13px] text-muted-foreground mb-1">Описание</p>
                <p className="text-[15px] text-foreground whitespace-pre-wrap break-words">{product.description}</p>
              </div>
            ) : null}

            {!editing && (
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
                    {saving ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  При привязке товара к магазину долг магазина пересчитывается автоматически.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] p-2 sm:max-w-4xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Фото товара</DialogTitle>
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
            <DialogTitle>Удалить товар?</DialogTitle>
            <DialogDescription>Товар «{product.name}» будет удален безвозвратно.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
