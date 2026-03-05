"use client";

import { useEffect, useState } from "react";
import { getShops } from "@/lib/api/shops";
import type { Shop } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateSafe } from "@/lib/date-utils";
import { useTranslations } from "@/lib/useTranslations";
import { Store, Wallet, AlertTriangle, CheckCircle } from "lucide-react";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import Link from "next/link";

export function ShopsReport() {
  const { t, locale } = useTranslations();
  const { formatAmount } = useFormattedAmount();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShops(1, 100, true).then((r) => setShops(r.shops)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="rounded-2xl animate-pulse">
          <CardContent className="p-6 h-32" />
        </Card>
      </div>
    );
  }

  const totalDebt = shops.reduce((s, sh) => s + parseFloat(sh.debt || "0"), 0);
  const overdueShops = shops.filter((s) => parseFloat(s.debt || "0") > 0);
  const overdueDebt = overdueShops.reduce((s, sh) => s + parseFloat(sh.debt || "0"), 0);
  const payments = (shop: Shop) => (shop.debtEntries ?? []).filter((e) => e.type === "payment");
  const totalPaid = shops.reduce(
    (s, sh) => s + payments(sh).reduce((p, pay) => p + parseFloat(pay.amount || "0"), 0),
    0
  );

  const lastPayment = (shop: Shop) => {
    const pays = payments(shop);
    return pays.length > 0
      ? pays.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;
  };

  const sortedByDebt = [...shops].sort((a, b) => parseFloat(b.debt || "0") - parseFloat(a.debt || "0"));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">{t("shopsReport.totalDebt")}</span>
            </div>
            <p className="text-2xl font-bold">{totalDebt.toLocaleString()} $</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Просрочено</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {overdueDebt.toLocaleString()} $
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {overdueShops.length} {t("shopsReport.shopsCount")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">{t("shopsReport.topDebtors")}</h3>
          <div className="space-y-2">
            {sortedByDebt.slice(0, 5).map((shop) => (
              <Link key={shop.id} href={`/shops/${shop.id}`}>
                <div className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{shop.name}</p>
                    <p className="text-xs text-muted-foreground">{shop.ownerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">
                      {formatAmount(parseFloat(shop.debt || "0"))}
                    </p>
                    {lastPayment(shop) && (
                      <p className="text-xs text-muted-foreground">
                        {t("shopsReport.payment")}: {formatDateSafe(lastPayment(shop)!.createdAt, "d MMM", locale)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 bg-card/95 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Движение по долгам (кто, когда)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(() => {
              const allEntries = shops.flatMap((shop) =>
                (shop.debtEntries ?? []).map((e) => ({ shop, entry: e }))
              );
              allEntries.sort((a, b) => new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime());
              return allEntries.length > 0 ? (
                allEntries.slice(0, 20).map(({ shop, entry }) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-xl bg-muted/30 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.type === "debt" ? t("shopsReport.debt") : t("shopsReport.payment")} • {formatAmount(parseFloat(entry.amount || "0"))}
                        {entry.description && ` • ${entry.description}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0 text-xs">
                      <p className="text-muted-foreground">
                        {entry.createdByUser?.name || "—"}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDateSafe(entry.createdAt, "d MMM, HH:mm", locale)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("shopsReport.noEntries")}</p>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Статистика</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t("shopsReport.active")}: {shops.filter((s) => s.status === "active").length}
            </Badge>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              {t("shopsReport.inactive")}: {shops.filter((s) => s.status === "inactive").length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {t("shopsReport.totalPaid")}: {totalPaid.toLocaleString()} $
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
