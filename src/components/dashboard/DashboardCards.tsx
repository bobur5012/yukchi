"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { getDashboard } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/api/dashboard";
import { useFormattedAmount } from "@/lib/useFormattedAmount";
import {
  Wallet,
  AlertTriangle,
  Plane,
  PiggyBank,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const metricCards = [
  {
    title: "Общий долг",
    getValue: (d: DashboardData, fa: (n: number) => string) => fa(parseFloat(d.metrics.totalDebt || "0")),
    href: "/shops",
    icon: Wallet,
    gradient: "from-indigo-500/20 to-blue-500/20 dark:from-indigo-500/30 dark:to-blue-500/30",
  },
  {
    title: "Активные поездки",
    getValue: (d: DashboardData) => String(d.metrics.tripsCount ?? 0),
    href: "/trips",
    icon: Plane,
    gradient: "from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30",
  },
  {
    title: "Остаток бюджета",
    getValue: (d: DashboardData, fa: (n: number) => string) => fa(parseFloat(d.metrics.remainingUsd || "0")),
    href: "/trips",
    icon: PiggyBank,
    gradient: "from-violet-500/20 to-indigo-500/20 dark:from-violet-500/30 dark:to-indigo-500/30",
  },
  {
    title: "Общий расход",
    getValue: (d: DashboardData, fa: (n: number) => string) => fa(parseFloat(d.metrics.totalExpensesUsd || "0")),
    href: "/trips",
    icon: TrendingDown,
    gradient: "from-amber-500/20 to-orange-500/20 dark:from-amber-500/30 dark:to-orange-500/30",
  },
  {
    title: "Общий приход",
    getValue: (d: DashboardData, fa: (n: number) => string) => fa(parseFloat(d.metrics.totalIncomeUsd || "0")),
    href: "/trips",
    icon: TrendingUp,
    gradient: "from-emerald-500/20 to-lime-500/20 dark:from-emerald-500/30 dark:to-lime-500/30",
  },
  {
    title: "Магазины",
    getValue: (d: DashboardData) => String(d.metrics.shopsCount ?? 0),
    href: "/shops",
    icon: AlertTriangle,
    gradient: "from-sky-500/20 to-cyan-500/20 dark:from-sky-500/30 dark:to-cyan-500/30",
  },
];

export function DashboardCards() {
  const role = useAuthStore((s) => s.user?.role);
  const { formatAmount } = useFormattedAmount();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="rounded-2xl animate-pulse">
            <CardContent className="p-3 h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if ((role === "admin" || role === "courier") && data) {
    return (
      <div className="grid gap-4 grid-cols-2">
        {metricCards.map(({ title, getValue, href, icon: Icon, gradient }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link href={href}>
              <Card className={`overflow-hidden bg-gradient-to-br ${gradient} border-0 shadow-lg h-24 transition-opacity hover:opacity-90 active:opacity-95`}>
                <CardHeader className="pb-1 pt-3 px-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <p className="text-[20px] font-bold tracking-[-0.03em] tabular-nums">
                    {getValue(data, formatAmount)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
}
