"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getActivity, type ActivityItem } from "@/lib/api/activity";
import { formatDateSafe } from "@/lib/date-utils";
import { useTranslations } from "@/lib/useTranslations";
import { Receipt, Wallet, Package, Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

function interpolate(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v),
    template
  );
}

function ActivityItemRow({
  item,
  locale,
  t,
}: {
  item: ActivityItem;
  locale: "ru" | "uz";
  t: (k: string) => string;
}) {
  const who = item.createdByUser?.name ?? t("activity.unknown");
  let href = "#";
  let label = "";

  if (item.type === "expense") {
    href = item.trip ? `/trips/${item.trip.id}` : "#";
    label = interpolate(t("activity.addedExpense"), { who, amount: item.amount ?? "0" }) + (item.trip ? ` ${t("activity.inTrip")} «${item.trip.name}»` : "");
  } else if (item.type === "debt") {
    href = item.shop ? `/shops/${item.shop.id}` : "#";
    label = interpolate(t("activity.addedDebt"), { who, amount: item.amount ?? "0" }) + (item.shop ? ` ${t("activity.inShop")} «${item.shop.name}»` : "");
  } else if (item.type === "product") {
    href = item.trip ? `/trips/${item.trip.id}` : "#";
    label = interpolate(t("activity.addedProduct"), { who, name: item.name ?? "" }) + (item.trip ? ` ${t("activity.inTrip")} «${item.trip.name}»` : "");
  }

  return (
    <Link href={href}>
      <motion.div
        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors active:bg-accent"
        whileTap={{ backgroundColor: "var(--accent)" }}
      >
        <div className="size-[42px] rounded-[13px] bg-primary/15 flex items-center justify-center shrink-0">
          {item.type === "expense" && <Receipt className="size-[18px] text-primary" />}
          {item.type === "debt" && <Wallet className="size-[18px] text-primary" />}
          {item.type === "product" && <Package className="size-[18px] text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium truncate">{label}</p>
          <p className="text-[12px] text-muted-foreground">
            {formatDateSafe(item.createdAt, "d MMM, HH:mm", locale)}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

export function ActivityFeed() {
  const { t, locale } = useTranslations();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getActivity(20)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="h-5 w-32 rounded-lg bg-muted/60 animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="size-[42px] rounded-[13px] bg-muted/60 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl bg-card border border-border/30 overflow-hidden"
    >
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[17px] font-semibold">{t("dashboard.activityFeed")}</h2>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Activity} title={t("activity.empty")} className="py-8" />
      ) : (
        <div className="divide-y divide-border/30">
          {items.slice(0, 10).map((item) => (
            <ActivityItemRow key={`${item.type}-${item.id}`} item={item} locale={locale} t={t} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
