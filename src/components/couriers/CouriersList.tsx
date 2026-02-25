"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getCouriers, deleteCourier } from "@/lib/api/couriers";
import { useAuthStore } from "@/stores/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Users, Crown, Star, Plus, Minus, Trash2 } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/ui/virtual-list";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
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

export function CouriersList() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";

  const [couriers, setCouriers] = useState<CourierWithPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [awardingId, setAwardingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCouriers = useCallback(() => {
    const pts = loadPoints();
    getCouriers()
      .then((list) => {
        const withPts: CourierWithPoints[] = list.map((c) => ({
          ...c,
          points: pts[c.id] ?? 0,
        }));
        withPts.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
        setCouriers(withPts);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCouriers(); }, [loadCouriers]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCourier(deleteId);
      setCouriers((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
      toast.success("Курьер удалён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  };

  const adjustPoints = (courierId: string, delta: number) => {
    const pts = loadPoints();
    pts[courierId] = Math.max(0, (pts[courierId] ?? 0) + delta);
    savePoints(pts);
    setCouriers((prev) =>
      prev
        .map((c) => (c.id === courierId ? { ...c, points: pts[courierId] } : c))
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    );
    setAwardingId(null);
  };

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  if (couriers.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <EmptyState
          icon={Users}
          title="Нет курьеров"
          description="Добавьте первого курьера"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Crown className="size-[18px] text-amber-400" />
        <h2 className="text-[17px] font-semibold">Лучшие курьеры</h2>
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
                {courier.avatarUrl ? (
                  <AvatarImage src={courier.avatarUrl} alt={courier.name} />
                ) : null}
                <AvatarFallback className={cn("text-sm font-semibold", index < 3 ? rankStyle.bg : "")}>
                  {getInitials(courier.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium truncate">{courier.name}</p>
                <p className="text-[13px] text-muted-foreground truncate">{courier.phone}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[11px]",
                      courier.status === "active"
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted"
                    )}
                  >
                    {courier.status === "active" ? "Активен" : "Неактивен"}
                  </Badge>
                  <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                    <Star className="size-3 text-amber-400 fill-amber-400" />
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
                      className="flex items-center gap-1 shrink-0"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => adjustPoints(courier.id, -1)}
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
                        onClick={() => adjustPoints(courier.id, 1)}
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
                      className="flex items-center gap-1 shrink-0"
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
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg" asChild>
                        <Link href={`/couriers/${courier.id}/edit`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(courier.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {!isAdmin && (
                <Button variant="ghost" size="icon" className="size-8 rounded-lg shrink-0" asChild>
                  <Link href={`/couriers/${courier.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>

      {isAdmin && (
        <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Удалить курьера?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Курьер будет помечен как неактивный.
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Удаление…" : "Удалить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
