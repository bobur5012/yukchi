"use client";

import { useEffect, useState } from "react";
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
import { Package, Store, Pencil, Trash2 } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import type { Product } from "@/types";
import type { Trip } from "@/types";
import { getShops } from "@/lib/api/shops";
import { updateProduct, deleteProduct } from "@/lib/api/products";
import type { Shop } from "@/types";
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
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<string | null>(product?.shopId ?? product?.shop?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (open && product) {
      getShops(1, 100).then((r) => setShops(r.shops));
      setShopId(product?.shopId ?? product?.shop?.id ?? null);
      setEditName(product.name);
      setEditQuantity(String(product.quantity));
      setEditSalePrice(product.salePrice ?? "");
      setEditDescription(product.description ?? "");
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

  const handleSaveEdit = async () => {
    if (!product) return;
    const q = parseInt(editQuantity, 10);
    if (!editName.trim() || isNaN(q) || q < 1) {
      toast.error("Заполните название и количество");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProduct(product.id, {
        name: editName.trim(),
        quantity: q,
        salePrice: editSalePrice ? parseFloat(editSalePrice).toFixed(2) : undefined,
        description: editDescription.trim() || undefined,
      });
      onProductUpdated?.(updated);
      setEditing(false);
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
      toast.success("Товар удалён");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setDeleting(false);
    }
  };

  if (!product) return null;

  return (
    <>
    <Sheet open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="flex-row items-center justify-between gap-2">
          <SheetTitle className="truncate">{product.name}</SheetTitle>
          {canEdit && (
            <div className="flex gap-2 shrink-0">
              {editing ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>Отмена</Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={saving}>{saving ? "…" : "Сохранить"}</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmOpen(true)}><Trash2 className="h-4 w-4" /></Button>
                </>
              )}
            </div>
          )}
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          {product.shop && (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-[15px] font-medium">Магазин: {product.shop.name}</span>
            </div>
          )}
          {product.imageUrl ? (
            <div className="rounded-xl overflow-hidden border border-border/50 aspect-video min-h-[200px] bg-muted">
              <img
                key={`${product.id}-${product.imageUrl ?? "no-image"}`}
                src={getAvatarUrl(product.imageUrl, `${product.id}-${product.imageUrl ?? ""}`) ?? product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-video min-h-[160px] rounded-xl bg-muted flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}
          {editing ? (
            <>
              <div>
                <p className="text-[13px] text-muted-foreground mb-1.5">Название</p>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground mb-1.5">Количество</p>
                <Input type="number" min={1} value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground mb-1.5">Цена продажи ($)</p>
                <Input type="number" step="0.01" value={editSalePrice} onChange={(e) => setEditSalePrice(e.target.value)} className="rounded-xl" placeholder="60" />
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground mb-1.5">Описание</p>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="rounded-xl resize-none" />
              </div>
            </>
          ) : (
            <>
              {product.description && (
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1">Описание</p>
                  <p className="text-[15px] text-foreground whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
              <div>
                <p className="text-[13px] text-muted-foreground">Количество</p>
                <p className="text-[15px] font-medium">{product.quantity}</p>
              </div>
            </>
          )}
          {!editing && (product.salePrice || product.pricePerKg) && (
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
                {saving ? "Сохраняем…" : "Сохранить"}
              </Button>
            </div>
          </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <DialogContent className="rounded-2xl max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Удалить товар?</DialogTitle>
          <DialogDescription>Товар «{product.name}» будет удалён безвозвратно.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Отмена</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Удаление…" : "Удалить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
