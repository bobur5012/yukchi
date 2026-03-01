"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getShop } from "@/lib/api/shops";
import type { Shop } from "@/types";
import { useAuthStore } from "@/stores/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateSafe } from "@/lib/date-utils";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import { useTranslations } from "@/lib/useTranslations";
import {
  MessageCircle,
  Phone,
  MapPin,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  Package,
  CreditCard,
  Plus,
} from "lucide-react";
import { PaymentDetailSheet } from "./PaymentDetailSheet";
import { ShopReminders } from "./ShopReminders";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { VirtualList } from "@/components/ui/virtual-list";
import type { ShopDebtEntry } from "@/types";
import { cn } from "@/lib/utils";

interface ShopDetailProps {
  shopId: string;
}

export function ShopDetail({ shopId }: ShopDetailProps) {
  const { t, locale } = useTranslations();
  const { formatAmount } = useFormattedAmount();
  const role = useAuthStore((s) => s.user?.role);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryDetail, setEntryDetail] = useState<ShopDebtEntry | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getShop(shopId)
      .then((data) => setShop(data ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ListSkeleton count={3} />;
  }

  if (error) {
    return <DataErrorState message={error} onRetry={load} />;
  }

  if (!shop) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Магазин не найден
      </div>
    );
  }

  const phoneDigits = shop.phone?.replace(/\D/g, "") || "";
  const telegramUrl = phoneDigits ? `https://t.me/+${phoneDigits}` : "#";
  const hasTelegramLink = !!phoneDigits;

  const allEntries = [...(shop.debtEntries ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="debt" className="w-full">
        <TabsList className={cn(
          "w-full grid rounded-2xl",
          role === "admin" ? "grid-cols-4" : "grid-cols-3"
        )}>
          <TabsTrigger value="debt" className="flex items-center gap-1.5 min-w-0">
            <CreditCard className="size-4 shrink-0" />
            <span className="hidden sm:inline truncate">Долг</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1.5 min-w-0">
            <Package className="size-4 shrink-0" />
            <span className="hidden sm:inline truncate">Товары</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-1.5 min-w-0">
            <Phone className="size-4 shrink-0" />
            <span className="hidden sm:inline truncate">Контакты</span>
          </TabsTrigger>
          {role === "admin" && (
            <TabsTrigger value="reminders" className="flex items-center gap-1.5 min-w-0">
              <Bell className="size-4 shrink-0" />
              <span className="hidden sm:inline truncate">Напомин.</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── DEBT TAB ─────────────────────────────────────── */}
        <TabsContent value="debt" className="mt-4">
          <Card className="rounded-2xl card-premium">
            <CardContent className="p-4 space-y-4">

              {/* Debt amount + status */}
              <div>
                <p className="text-sm text-muted-foreground">Общая сумма долга</p>
                <p className="text-[26px] font-bold tabular-nums tracking-[-0.03em]">
                  {formatAmount(parseFloat(shop.debt || "0"))}
                </p>
                <span
                  className={cn(
                    "inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium",
                    shop.status === "active"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {shop.status === "active" ? "Активен" : "Неактивен"}
                </span>
              </div>

              {/* Action buttons — 2-column grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="h-11 rounded-xl gap-2">
                  <Link href={`/shops/${shopId}/payments/new`}>
                    <ArrowUpCircle className="h-4 w-4" />
                    Внести оплату
                  </Link>
                </Button>
                {(role === "admin" || role === "courier") && (
                  <Button asChild variant="outline" className="h-11 rounded-xl gap-2">
                    <Link href={`/shops/${shopId}/debt/new`}>
                      <ArrowDownCircle className="h-4 w-4" />
                      Добавить долг
                    </Link>
                  </Button>
                )}
              </div>

              {/* Payment history */}
              <div>
                <p className="section-title mb-3">История платежей</p>
                {allEntries.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="Нет записей"
                    description="Записи появятся здесь"
                  />
                ) : (
                  <VirtualList
                    items={allEntries}
                    estimateSize={72}
                    gap={8}
                    renderItem={(entry) => {
                      const isPayment = entry.type === "payment";
                      return (
                        <div
                          className={cn(
                            "flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer transition-colors active:scale-[0.99]",
                            isPayment
                              ? "bg-emerald-500/8 hover:bg-emerald-500/12 border border-emerald-500/20"
                              : "bg-red-500/8 hover:bg-red-500/12 border border-red-500/20"
                          )}
                          onClick={() => setEntryDetail(entry)}
                        >
                          <div className={cn(
                            "size-9 rounded-xl flex items-center justify-center shrink-0",
                            isPayment ? "bg-emerald-500/15" : "bg-red-500/15"
                          )}>
                            {isPayment
                              ? <ArrowDownCircle className="size-5 text-emerald-500" />
                              : <ArrowUpCircle className="size-5 text-red-500" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-semibold text-[15px] tabular-nums",
                              isPayment ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            )}>
                              {isPayment ? "+" : "−"}{formatAmount(Math.abs(parseFloat(entry.amount)))}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatDateSafe(entry.createdAt, "d MMM yyyy, HH:mm", locale)}
                              {entry.description && ` · ${entry.description}`}
                              {entry.createdByUser?.name && ` · ${entry.createdByUser.name}`}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PRODUCTS TAB ─────────────────────────────────── */}
        <TabsContent value="products" className="mt-4">
          <Card className="rounded-2xl card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="section-title mb-0">Привязанные товары</p>
                {(role === "admin" || role === "courier") && (
                  <Button asChild size="sm">
                    <Link href={`/products/new?shopId=${shopId}`} className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {t("quickActions.addProduct")}
                    </Link>
                  </Button>
                )}
              </div>
              {(shop.products?.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Нет привязанных товаров. Привяжите товар в разделе «Товары» или добавьте новый.
                </p>
              ) : (
                <div className="space-y-2">
                  {shop.products?.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl bg-muted/50"
                    >
                      <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[15px] truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.quantity} {p.unit ?? "шт"}
                          {p.salePrice && ` · ${p.salePrice} $`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REMINDERS TAB (admin only) ─────────────────────── */}
        {role === "admin" && (
          <TabsContent value="reminders" className="mt-4">
            <ShopReminders shopId={shopId} />
          </TabsContent>
        )}

        {/* ── CONTACTS TAB ─────────────────────────────────── */}
        <TabsContent value="contacts" className="mt-4">
          <div className="space-y-3">
            {shop.phone && (
              <Card className="rounded-2xl card-premium overflow-hidden">
                <CardContent className="p-0">
                  <a
                    href={`tel:${shop.phone}`}
                    className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors active:bg-accent"
                  >
                    <div className="size-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Phone className="size-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Телефон</p>
                      <p className="font-semibold text-[15px] truncate">{shop.phone}</p>
                    </div>
                    <span className="text-sm font-medium text-emerald-500 shrink-0">
                      Позвонить
                    </span>
                  </a>
                </CardContent>
              </Card>
            )}

            {hasTelegramLink && (
              <Card className="rounded-2xl card-premium overflow-hidden">
                <CardContent className="p-0">
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors active:bg-accent"
                  >
                    <div className="size-11 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                      <MessageCircle className="size-5 text-sky-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Telegram</p>
                      <p className="font-semibold text-[15px] truncate">
                        {shop.phone}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-sky-500 shrink-0">
                      Открыть чат
                    </span>
                  </a>
                </CardContent>
              </Card>
            )}

            {shop.address && (
              <Card className="rounded-2xl card-premium">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="size-5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Адрес</p>
                    <p className="font-semibold text-[15px]">{shop.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!shop.phone && !shop.address && (
              <Card className="rounded-2xl card-premium">
                <CardContent className="py-10 text-center text-muted-foreground">
                  Контакты не указаны
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <PaymentDetailSheet
        open={!!entryDetail}
        onOpenChange={(open) => !open && setEntryDetail(null)}
        payment={
          entryDetail
            ? {
                id: entryDetail.id,
                amount: entryDetail.amount,
                date: entryDetail.createdAt,
                comment: entryDetail.description,
                createdBy: entryDetail.createdByUser?.name,
              }
            : null
        }
        currency="USD"
      />
    </div>
  );
}
