"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { getDashboard } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/api/dashboard";
import { Plane } from "lucide-react";

export function ActiveTripsList() {
  const role = useAuthStore((s) => s.user?.role);
  const [activeTrips, setActiveTrips] = useState<DashboardData["activeTrips"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((data) => {
        if ((role === "admin" || role === "courier") && data?.activeTrips) {
          setActiveTrips(data.activeTrips);
        }
      })
      .finally(() => setLoading(false));
  }, [role]);

  if (role !== "admin" && role !== "courier") return null;

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">Текущие поездки</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeTrips.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">Текущие поездки</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            Нет активных поездок
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <h2 className="text-lg font-semibold">Текущие поездки</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeTrips.map((trip, i) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Plane className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{trip.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {trip.region?.name ?? ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">
                    {parseFloat(trip.budgetUsd || trip.budget || "0").toLocaleString()} $
                  </p>
                  <p className="text-xs text-muted-foreground">бюджет</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
