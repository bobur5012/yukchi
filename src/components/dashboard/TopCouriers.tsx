"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getCouriers } from "@/lib/api/couriers";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Users, ChevronRight, Plus, Minus } from "lucide-react";
import { cn, getAvatarUrl } from "@/lib/utils";
import type { Courier } from "@/types";

const POINTS_KEY = "yukchi_courier_points";

function loadPoints(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(POINTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePoints(points: Record<string, number>) {
  localStorage.setItem(POINTS_KEY, JSON.stringify(points));
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const RANK_STYLES = [
  { border: "border-amber-400/60", bg: "bg-amber-500/10", text: "text-amber-400", label: "🥇" },
  { border: "border-slate-400/60", bg: "bg-slate-500/10", text: "text-slate-400", label: "🥈" },
  { border: "border-orange-400/60", bg: "bg-orange-700/10", text: "text-orange-500", label: "🥉" },
];

interface CourierWithPoints extends Courier {
  points: number;
}

export function TopCouriers() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";

  const [couriers, setCouriers] = useState<CourierWithPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [awardingId, setAwardingId] = useState<string | null>(null);

  const loadCouriers = useCallback(() => {
    const pts = loadPoints();
    getCouriers()
      .then((list) => {
        const active = list.filter((c) => c.status === "active");
        const withPts: CourierWithPoints[] = active.map((c) => ({
          ...c,
          points: pts[c.id] ?? 0,
        }));
        withPts.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
        setCouriers(withPts.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCouriers(); }, [loadCouriers]);

  const adjustPoints = (courierId: string, delta: number) => {
    const pts = loadPoints();
    pts[courierId] = Math.max(0, (pts[courierId] ?? 0) + delta);
    savePoints(pts);
    setCouriers((prev) =>
      prev
        .map((c) => (c.id === courierId ? { ...c, points: pts[courierId] } : c))
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="h-5 w-40 rounded-lg bg-muted/60 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="size-10 rounded-full bg-muted/60 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (couriers.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="rounded-2xl bg-card border border-border/30 overflow-hidden"
    >
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="size-[18px] text-amber-400" />
          <h2 className="text-[17px] font-semibold">Лучшие курьеры</h2>
        </div>
        <Link href="/couriers" className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <Users className="size-4" />
          Все
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="divide-y divide-border/30">
        {couriers.map((courier, index) => {
          const rankStyle = RANK_STYLES[index];
          const isAwarding = awardingId === courier.id;

          return (
            <motion.div
              key={courier.id}
              layout
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors",
                index < 3 && "hover:bg-accent/20"
              )}
            >
              <div className="w-6 shrink-0 text-center">
                {index < 3 ? (
                  <span className="text-base leading-none">{rankStyle.label}</span>
                ) : (
                  <span className="text-[13px] text-muted-foreground font-medium">#{index + 1}</span>
                )}
              </div>

              <Avatar className={cn("size-10 shrink-0 border-2", index < 3 ? rankStyle.border : "border-transparent")}>
                <AvatarImage src={getAvatarUrl(courier.avatarUrl)} alt={courier.name} />
                <AvatarFallback className={cn("text-sm font-semibold", index < 3 ? rankStyle.bg : "")}>
                  {getInitials(courier.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium truncate">{courier.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="size-3 text-amber-400 fill-amber-400" />
                  <span className="text-[13px] text-muted-foreground">
                    {courier.points} {courier.points === 1 ? "балл" : courier.points < 5 ? "балла" : "баллов"}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <AnimatePresence mode="wait">
                  {isAwarding ? (
                    <motion.div
                      key="controls"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => { adjustPoints(courier.id, -1); setAwardingId(null); }}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <Badge variant="secondary" className="px-2 min-w-[32px] justify-center tabular-nums">
                        {courier.points}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => { adjustPoints(courier.id, 1); setAwardingId(null); }}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="award-btn"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-amber-400 hover:text-amber-500 hover:bg-amber-500/10"
                        onClick={() => setAwardingId(courier.id)}
                        title="Наградить баллами"
                      >
                        <Crown className="size-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {!isAdmin && courier.points > 0 && (
                <div className={cn(
                  "size-8 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0",
                  index < 3 ? rankStyle.bg : "bg-muted/50"
                )}>
                  <span className={index < 3 ? rankStyle.text : "text-muted-foreground"}>
                    {courier.points}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
