"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getShop } from "@/lib/api/shops";
import type { Shop } from "@/types";
import { useAuthStore } from "@/stores/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateSafe } from "@/lib/date-utils";
import { MessageCircle, Phone, MapPin, Plus, Wallet, Receipt } from "lucide-react";
import { PaymentDetailSheet } from "./PaymentDetailSheet";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { VirtualList } from "@/components/ui/virtual-list";
import type { ShopDebtEntry } from "@/types";

interface ShopDetailProps {
  shopId: string;
}

export function ShopDetail({ shopId }: ShopDetailProps) {
  const role = useAuthStore((s) => s.user?.role);
  const [shop, setShop] = useState<Shop | null>(null);
  const [entryDetail, setEntryDetail] = useState<ShopDebtEntry | null>(null);

  const refreshShop = () => getShop(shopId).then(setShop);

  useEffect(() => {
    getShop(shopId).then(setShop);
  }, [shopId]);

  if (shop === null) {
    return <ListSkeleton count={3} />;
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
  const payments = (shop.debtEntries ?? []).filter((e) => e.type === "payment");

  return (
    <div className="space-y-4 pb-20">
      <Tabs defaultValue="debt" className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-2xl">
          <TabsTrigger value="debt">Долг</TabsTrigger>
          <TabsTrigger value="products">Товары</TabsTrigger>
          <TabsTrigger value="contacts">Контакты</TabsTrigger>
        </TabsList>

        <TabsContent value="debt" className="mt-4">
          <Card className="rounded-2xl card-premium">
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Общая сумма долга</p>
                <p className="text-[22px] font-bold tabular-nums tracking-[-0.03em]">
                  {parseFloat(shop.debt || "0").toLocaleString()} UZS
                </p>
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                    shop.status === "active"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {shop.status === "active" ? "Активен" : "Неактивен"}
                </span>
              </div>
              <div className="flex gap-2 mb-4 sticky top-14 z-10 bg-card -mx-4 px-4 py-2 -mt-2">
                <Button asChild className="flex-1">
                  <Link href={`/shops/${shopId}/payments/new`} className="inline-flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" />
                    Внести оплату
                  </Link>
                </Button>
                {role === "admin" && (
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/shops/${shopId}/debt/new`} className="inline-flex items-center justify-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Добавить долг
                    </Link>
                  </Button>
                )}
              </div>
              <div>
                <p className="section-title mb-2">История платежей</p>
                {payments.length === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    title="Нет платежей"
                    description="Платежи появятся здесь"
                  />
                ) : (
                  <VirtualList
                    items={payments}
                    estimateSize={64}
                    gap={8}
                    height="min(300px, 40vh)"
                    renderItem={(pay) => (
                      <div
                        className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors active:scale-[0.99]"
                        onClick={() => setEntryDetail(pay)}
                      >
                        <div>
                          <p className="font-medium">{pay.amount} UZS</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateSafe(pay.createdAt, "d MMM yyyy")}
                            {pay.description && ` · ${pay.description}`}
                          </p>
                        </div>
                      </div>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card className="rounded-2xl card-premium">
            <CardContent className="py-8 text-center text-muted-foreground">
              Товары (необязательно)
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <Card className="rounded-2xl card-premium">
            <CardContent className="p-4 space-y-4">
              {shop.phone && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{shop.phone}</span>
                  <Button size="sm" className="shrink-0" asChild>
                    <a href={`tel:${shop.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Позвонить
                    </a>
                  </Button>
                </div>
              )}
              {hasTelegramLink && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Telegram</span>
                  <Button size="sm" variant="outline" className="shrink-0" asChild>
                    <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Открыть чат
                    </a>
                  </Button>
                </div>
              )}
              {shop.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm">{shop.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentDetailSheet
        open={!!entryDetail}
        onOpenChange={(open) => !open && setEntryDetail(null)}
        payment={entryDetail ? { id: entryDetail.id, amount: entryDetail.amount, date: entryDetail.createdAt, comment: entryDetail.description } : null}
        currency="UZS"
      />
    </div>
  );
}
