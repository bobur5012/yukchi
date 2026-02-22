"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { getDashboard } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/api/dashboard";
import { formatDateSafe } from "@/lib/date-utils";
import { Plane } from "lucide-react";

export function RecentActivity() {
  const role = useAuthStore((s) => s.user?.role);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-8 animate-pulse" />
      </Card>
    );
  }

  if ((role === "admin" || role === "courier") && data?.recentTrips) {
    const trips = data.recentTrips.slice(0, 5);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <h2 className="text-lg font-semibold">Последние поездки</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {trips.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Нет поездок</p>
            ) : (
              trips.map((item) => (
                <Link key={item.id} href={`/trips/${item.id}`}>
                  <div className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Plane className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.region?.name ?? ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDateSafe(item.departureDate ?? "", "d MMM")}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return null;
}
