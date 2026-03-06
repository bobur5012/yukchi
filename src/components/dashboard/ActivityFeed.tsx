"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getActivity, type ActivityItem } from "@/lib/api/activity";
import { formatDateSafe } from "@/lib/date-utils";
import { useTranslations } from "@/lib/useTranslations";
import { Receipt, Wallet, Package, Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 6;

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
  onOpen,
}: {
  item: ActivityItem;
  locale: "ru" | "uz";
  t: (k: string) => string;
  onOpen: (item: ActivityItem) => void;
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
    <motion.button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/40 transition-colors active:bg-accent"
      whileTap={{ backgroundColor: "var(--accent)" }}
      onClick={() => onOpen(item)}
    >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/12">
          {item.type === "expense" && <Receipt className="size-[16px] text-primary" />}
          {item.type === "debt" && <Wallet className="size-[16px] text-primary" />}
          {item.type === "product" && <Package className="size-[16px] text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[13px] font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatDateSafe(item.createdAt, "d MMM, HH:mm", locale)}
          </p>
        </div>
    </motion.button>
  );
}

function getActivityDetails(
  item: ActivityItem,
  locale: "ru" | "uz",
  t: (k: string) => string
) {
  const who = item.createdByUser?.name ?? t("activity.unknown");
  let href = "#";
  let label = "";
  let locationLabel = "";

  if (item.type === "expense") {
    href = item.trip ? `/trips/${item.trip.id}` : "#";
    label =
      interpolate(t("activity.addedExpense"), {
        who,
        amount: item.amount ?? "0",
      }) +
      (item.trip ? ` ${t("activity.inTrip")} «${item.trip.name}»` : "");
    locationLabel = item.trip?.name ?? "—";
  } else if (item.type === "debt") {
    href = item.shop ? `/shops/${item.shop.id}` : "#";
    label =
      interpolate(t("activity.addedDebt"), {
        who,
        amount: item.amount ?? "0",
      }) +
      (item.shop ? ` ${t("activity.inShop")} «${item.shop.name}»` : "");
    locationLabel = item.shop?.name ?? "—";
  } else {
    href = item.trip ? `/trips/${item.trip.id}` : "#";
    label =
      interpolate(t("activity.addedProduct"), {
        who,
        name: item.name ?? "",
      }) +
      (item.trip ? ` ${t("activity.inTrip")} «${item.trip.name}»` : "");
    locationLabel = item.trip?.name ?? "—";
  }

  return {
    href,
    label,
    description: "description" in item ? item.description ?? "" : "",
    locationLabel,
    dateLabel: formatDateSafe(item.createdAt, "d MMMM yyyy, HH:mm", locale),
  };
}

export function ActivityFeed() {
  const { t, locale } = useTranslations();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);

  useEffect(() => {
    let active = true;

    getActivity(36)
      .then((r) => {
        if (!active) return;
        setItems(r.items);
        setPage(1);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setPage(1);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [currentPage, items]);

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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold">{t("dashboard.activityFeed")}</h2>
          {items.length > 0 ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              {items.length}
            </span>
          ) : null}
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Activity} title={t("activity.empty")} className="py-8" />
      ) : (
        <>
          <div className="divide-y divide-border/30">
          {pagedItems.map((item) => (
            <ActivityItemRow
              key={`${item.type}-${item.id}`}
              item={item}
              locale={locale}
              t={t}
              onOpen={setSelectedItem}
            />
          ))}
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-3 text-[12px]"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
              >
                {t("activity.prevPage")}
              </Button>
              <span className="text-[12px] text-muted-foreground">
                {t("activity.pageLabel")
                  .replace("{{page}}", String(currentPage))
                  .replace("{{total}}", String(totalPages))}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-3 text-[12px]"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
              >
                {t("activity.nextPage")}
              </Button>
            </div>
          ) : null}
        </>
      )}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(28,28,34,0.98)_0%,rgba(16,16,20,0.96)_100%)] text-foreground shadow-[0_18px_44px_rgba(0,0,0,0.35)]">
          {selectedItem ? (
            (() => {
              const details = getActivityDetails(selectedItem, locale, t);
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>{t("activity.detailTitle")}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {details.dateLabel}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-[15px] font-medium leading-6 text-foreground">
                      {details.label}
                    </p>
                    {details.description ? (
                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                        <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                          {t("common.comment")}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-[14px]">
                          {details.description}
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-[13px] text-muted-foreground">
                      {t("activity.locationLabel")}: {details.locationLabel}
                    </div>
                  </div>
                  <DialogFooter>
                    {details.href !== "#" ? (
                      <Button asChild className="rounded-2xl">
                        <Link href={details.href}>{t("activity.openSource")}</Link>
                      </Button>
                    ) : null}
                  </DialogFooter>
                </>
              );
            })()
          ) : null}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
