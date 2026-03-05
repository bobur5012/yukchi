"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getDashboard } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/api/dashboard";
import { formatDateSafe } from "@/lib/date-utils";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import { useTranslations } from "@/lib/useTranslations";
import {
  Banknote,
  PiggyBank,
  Plane,
  Receipt,
  Store,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { DataErrorState } from "@/components/ui/data-error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { TopCouriers } from "./TopCouriers";
import { ActivityFeed } from "./ActivityFeed";
import { CourierDashboard } from "./CourierDashboard";
import { useAuthStore } from "@/stores/auth";
import { CurrencyTicker } from "./CurrencyTicker";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-muted/60 animate-pulse", className)} />;
}

function MetricCard({
  href,
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  delay,
}: {
  href: string;
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.24 }}
    >
      <Link href={href}>
        <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(29,29,35,0.98)_0%,rgba(20,20,26,0.92)_100%)] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-transform active:scale-[0.985]">
          <div className={cn("mb-3 flex size-9 items-center justify-center rounded-2xl", iconBg)}>
            <Icon className={cn("size-[18px]", iconColor)} />
          </div>
          <p className="text-[11px] text-muted-foreground">{title}</p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.035em] tabular-nums">
            {value}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function ActivityRow({
  id,
  title,
  subtitle,
  date,
  locale,
}: {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  locale: "ru" | "uz";
}) {
  return (
    <Link href={`/trips/${id}`}>
      <motion.div
        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors active:bg-accent"
        whileTap={{ backgroundColor: "var(--accent)" }}
      >
        <div className="size-[42px] rounded-[13px] bg-primary/15 flex items-center justify-center shrink-0">
          <Receipt className="size-[18px] text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium truncate">{title}</p>
          <p className="text-[13px] text-muted-foreground truncate">{subtitle}</p>
        </div>
        <span className="text-[12px] text-muted-foreground shrink-0">
          {formatDateSafe(date, "d MMM", locale)}
        </span>
      </motion.div>
    </Link>
  );
}

export function Dashboard() {
  const { t, locale } = useTranslations();
  const { formatAmount } = useFormattedAmount();
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getDashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : t("common.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    getDashboard()
      .then((response) => {
        if (active) setData(response);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : t("common.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  // Show courier-specific dashboard
  if (user?.role === 'courier') {
    return (
      <div className="-mx-4 -mt-5">
        <CourierDashboard />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-[108px]" />)}
        </div>
        <Skeleton className="h-[160px]" />
      </div>
    );
  }

  if (error) {
    return <DataErrorState message={error} onRetry={load} />;
  }

  if (!data) return null;

  const m = data.metrics;
  const metrics = [
    {
      title: t("dashboard.totalDebt"),
      value: formatAmount(parseFloat(m.totalDebt || "0")),
      href: "/shops",
      icon: Banknote,
      iconBg: "bg-amber-500/14",
      iconColor: "text-amber-400",
    },
    {
      title: t("dashboard.shops"),
      value: m.shopsCount.toString(),
      href: "/shops",
      icon: Store,
      iconBg: "bg-sky-500/14",
      iconColor: "text-sky-400",
    },
    {
      title: t("dashboard.activeTrips"),
      value: m.tripsCount.toString(),
      href: "/trips",
      icon: Plane,
      iconBg: "bg-emerald-500/14",
      iconColor: "text-emerald-400",
    },
    {
      title: t("dashboard.remainingBudget"),
      value: formatAmount(parseFloat(m.remainingUsd || "0")),
      href: "/trips",
      icon: PiggyBank,
      iconBg: "bg-violet-500/14",
      iconColor: "text-violet-400",
    },
    {
      title: t("dashboard.totalExpenses"),
      value: formatAmount(parseFloat(m.totalExpensesUsd || "0")),
      href: "/trips",
      icon: ArrowDownCircle,
      iconBg: "bg-rose-500/14",
      iconColor: "text-rose-400",
    },
    {
      title: t("dashboard.totalIncome"),
      value: formatAmount(parseFloat(m.totalIncomeUsd || "0")),
      href: "/trips",
      icon: ArrowUpCircle,
      iconBg: "bg-teal-500/14",
      iconColor: "text-teal-400",
    },
  ];

  return (
    <div className="space-y-4">
      <CurrencyTicker className="rounded-[30px] border border-white/8 shadow-[0_12px_28px_rgba(0,0,0,0.18)]" />

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.title} {...metric} delay={0.05 + index * 0.03} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="overflow-hidden rounded-[30px] border border-border/30 bg-card/95 shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
      >
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <TrendingUp className="size-5" />
            </div>
            <h2 className="text-[20px] font-semibold tracking-[-0.03em]">
              {t("dashboard.recentTrips")}
            </h2>
          </div>
        </div>
        <div className="divide-y divide-border/30">
          {(data.recentTrips ?? []).length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t("dashboard.noTrips")}
              description={t("dashboard.noTripsDescription")}
            />
          ) : (
            (data.recentTrips ?? []).slice(0, 5).map((trip) => (
              <ActivityRow
                key={trip.id}
                id={trip.id}
                title={trip.name}
                subtitle={trip.region?.name ?? ""}
                date={trip.departureDate ?? ""}
                locale={locale}
              />
            ))
          )}
        </div>
      </motion.div>

      <ActivityFeed />
      <TopCouriers />
    </div>
  );
}
