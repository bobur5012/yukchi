"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getDashboard } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/api/dashboard";
import { formatDateSafe } from "@/lib/date-utils";
import { useTranslations } from "@/lib/useTranslations";
import {
  AlertTriangle,
  Banknote,
  ChevronRight,
  Package,
  PiggyBank,
  Plane,
  Plus,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { TopCouriers } from "./TopCouriers";

function AnimatedNumber({ value }: { value: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="tabular-nums"
    >
      {parseFloat(value || "0").toLocaleString()}
    </motion.span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-muted/60 animate-pulse", className)} />;
}

function MetricCard({
  title,
  value,
  href,
  icon: Icon,
  iconBg,
  iconColor,
  delay = 0,
}: {
  title: string;
  value: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
    >
      <Link href={href}>
        <motion.div
          className="rounded-2xl bg-card border border-border/30 p-4 active:scale-[0.98] transition-transform"
          whileTap={{ scale: 0.97 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
              <Icon className={cn("size-[18px]", iconColor)} />
            </div>
            <span className="text-[13px] text-muted-foreground font-medium flex-1 leading-snug">
              {title}
            </span>
          </div>
          <p className="text-[22px] font-bold tabular-nums tracking-[-0.03em]">
            {value}
          </p>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function HeroCard({
  label,
  amount,
  subtitle,
  href,
  icon: Icon,
  gradient,
  warning,
}: {
  label: string;
  amount: string;
  subtitle?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  warning?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link href={href}>
        <motion.div
          className={cn("rounded-2xl p-5 overflow-hidden relative", gradient)}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.12 }}
        >
          <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/8 pointer-events-none" />
          <div className="absolute -right-3 -bottom-8 size-24 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Icon className="size-[18px] text-white" />
                </div>
                <p className="text-[13px] text-white/75 font-medium">{label}</p>
              </div>
              <p className="text-[34px] font-bold text-white tracking-[-0.04em] leading-none tabular-nums">
                <AnimatedNumber value={amount} /> $
              </p>
              {subtitle && (
                <p className={cn("text-[13px] mt-1.5 font-medium", warning ? "text-amber-200" : "text-white/70")}>
                  {subtitle}
                </p>
              )}
            </div>
            <ChevronRight className="size-5 text-white/50 shrink-0 mt-0.5" />
          </div>
        </motion.div>
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[116px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[92px]" />)}
        </div>
        <Skeleton className="h-[160px]" />
      </div>
    );
  }

  if (!data) return null;

  const m = data.metrics;
  const totalDebt = parseFloat(m.totalDebt || "0");
  const heroGradient = totalDebt > 0
    ? "bg-gradient-to-br from-amber-500 to-orange-600"
    : "bg-gradient-to-br from-indigo-500 to-violet-600";

  return (
    <div className="space-y-4">
      <HeroCard
        label={t("dashboard.totalDebt")}
        amount={m.totalDebt}
        subtitle={totalDebt > 0 ? `${t("dashboard.debt")}: ${parseFloat(m.totalDebt).toLocaleString()} $` : undefined}
        href="/shops"
        icon={Banknote}
        gradient={heroGradient}
        warning={totalDebt > 0}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="flex gap-2"
      >
        <Button asChild className="flex-1 h-[44px] rounded-[13px] text-[15px]">
          <Link href="/trips/new" className="inline-flex items-center gap-1.5">
            <Plus className="size-4" />
            {t("dashboard.newTrip")}
          </Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1 h-[44px] rounded-[13px] text-[15px]">
          <Link href="/shops/new" className="inline-flex items-center gap-1.5">
            <Wallet className="size-4" />
            {t("dashboard.addDebt")}
          </Link>
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title={t("dashboard.debt")} value={`${parseFloat(m.totalDebt).toLocaleString()} $`}
          href="/shops" icon={AlertTriangle}
          iconBg="bg-amber-500/15" iconColor="text-amber-400" delay={0.1}
        />
        <MetricCard
          title={t("dashboard.activeTrips")} value={m.tripsCount.toString()}
          href="/trips" icon={Plane}
          iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.13}
        />
        <MetricCard
          title={t("dashboard.remainingBudget")} value={`${parseFloat(m.remainingUsd).toLocaleString()} $`}
          href="/trips" icon={PiggyBank}
          iconBg="bg-violet-500/15" iconColor="text-violet-400" delay={0.16}
        />
        <MetricCard
          title={t("dashboard.totalBudget")} value={`${parseFloat(m.totalBudgetUsd).toLocaleString()} $`}
          href="/trips" icon={TrendingUp}
          iconBg="bg-indigo-500/15" iconColor="text-indigo-400" delay={0.19}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl bg-card border border-border/30 overflow-hidden"
      >
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-[17px] font-semibold">{t("dashboard.recentTrips")}</h2>
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

      <TopCouriers />
    </div>
  );
}
