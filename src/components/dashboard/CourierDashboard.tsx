"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Circle,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  Wallet,
  ListTodo,
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  type CourierTask,
} from "@/lib/api/tasks";
import {
  getMyDebtPaymentActivity,
  type DebtPaymentItem,
} from "@/lib/api/activity";
import { fetchCBURates, type CurrencyRates } from "@/lib/api/cbu-rates";
import { formatDateSafe } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FLAG_MAP: Record<string, string> = {
  USD: "🇺🇸",
  UZS: "🇺🇿",
  TRY: "🇹🇷",
};

function CurrencyTicker() {
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchCBURates()
      .then((data) => {
        if (active) setRates(data);
      })
      .catch(() => {
        if (active) setRates(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => {
    if (!rates) {
      return [
        { pair: "USD → UZS", value: "..." },
        { pair: "USD → TRY", value: "..." },
        { pair: "TRY → UZS", value: "..." },
        { pair: "TRY → USD", value: "..." },
      ];
    }

    return [
      {
        pair: "USD → UZS",
        value: rates.usdUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }),
      },
      {
        pair: "USD → TRY",
        value: rates.usdTry.toFixed(2),
      },
      {
        pair: "TRY → UZS",
        value: rates.tryUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }),
      },
      {
        pair: "TRY → USD",
        value: rates.tryUsd.toFixed(4),
      },
    ];
  }, [rates]);

  const repeatedItems = [...items, ...items];

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-white/5 bg-[linear-gradient(180deg,rgba(25,25,31,0.92)_0%,rgba(16,16,21,0.74)_100%)] backdrop-blur supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(25,25,31,0.78)_0%,rgba(16,16,21,0.58)_100%)]"
    >
      <div className="relative overflow-hidden py-1.5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-card via-card/85 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-card via-card/85 to-transparent" />
        <div className={cn("courier-ticker-track", loading && "opacity-80")}>
          {repeatedItems.map((item, index) => {
            const [from, to] = item.pair.split(" → ");
            return (
              <div
                key={`${item.pair}-${index}`}
                className="flex items-center gap-2 rounded-full border border-white/8 bg-background/45 px-2.5 py-1 text-[12px] shadow-sm shadow-black/10"
              >
                <span className="whitespace-nowrap text-muted-foreground">
                  {FLAG_MAP[from] ?? from} → {FLAG_MAP[to] ?? to}
                </span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-emerald-400">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function OverviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20"
      : tone === "warning"
        ? "from-amber-500/20 to-amber-500/5 border-amber-500/20"
        : "from-violet-500/20 to-violet-500/5 border-violet-500/20";

  return (
    <div
      className={cn(
        "rounded-[26px] border bg-gradient-to-br p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.14)]",
        toneClass
      )}
    >
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function CourierDashboard() {
  const { t, locale } = useTranslations();
  const [tasks, setTasks] = useState<CourierTask[]>([]);
  const [payments, setPayments] = useState<DebtPaymentItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  const loadTasks = useCallback(() => {
    setTasksLoading(true);
    getTasks()
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, []);

  const loadPayments = useCallback(() => {
    setPaymentsLoading(true);
    getMyDebtPaymentActivity(20)
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  }, []);

  useEffect(() => {
    loadTasks();
    loadPayments();
  }, [loadTasks, loadPayments]);

  const handleAddTask = async () => {
    const title = newTaskTitle.trim();
    if (!title || addingTask) return;
    setAddingTask(true);
    try {
      const created = await createTask(title);
      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle("");
    } catch (e) {
      toast.error((e as Error).message || "Не удалось создать задачу");
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (task: CourierTask) => {
    if (togglingId) return;
    setTogglingId(task.id);
    try {
      const updated = await updateTask(task.id, {
        completed: !task.completed,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? updated : t))
      );
    } catch (e) {
      toast.error((e as Error).message || "Не удалось обновить");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = async (task: CourierTask) => {
    if (deletingId) return;
    setDeletingId(task.id);
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e) {
      toast.error((e as Error).message || "Не удалось удалить");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2.5 pb-3">
      <CurrencyTicker />

      <div className="space-y-2.5 px-2.5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-1.5"
        >
          <OverviewStat
            label={t("courier.pendingTasks")}
            value={pendingTasks.toString()}
            tone="primary"
          />
          <OverviewStat
            label={t("courier.completedTasks")}
            value={completedTasks.toString()}
            tone="success"
          />
          <OverviewStat
            label={t("activity.lastPayments")}
            value={payments.length.toString()}
            tone="warning"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[30px] border border-border/30 bg-card/95 shadow-[0_12px_34px_rgba(0,0,0,0.22)]"
        >
          <div className="px-4 pt-4 pb-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <ListTodo className="size-5" />
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.03em]">
                    {t("tasks.title")}
                  </h2>
                  <p className="text-[12px] text-muted-foreground">
                    {pendingTasks > 0
                      ? `${pendingTasks} ${t("courier.pendingTasks").toLowerCase()}`
                      : t("tasks.empty")}
                  </p>
                </div>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary">
                {tasks.length}
              </div>
            </div>
          </div>

        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <Input
              placeholder={t("tasks.addPlaceholder")}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="h-12 flex-1 rounded-2xl border-border/50 bg-background/60 px-4 text-[15px]"
            />
            <Button
              size="icon"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim() || addingTask}
              className="size-12 shrink-0 rounded-2xl shadow-lg shadow-primary/20"
            >
              <Plus className="size-5" />
            </Button>
          </div>
        </div>

        {tasksLoading ? (
          <div className="space-y-2 px-4 pb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-border/30 bg-background/40 px-3 py-3"
              >
                <div className="size-6 rounded-full bg-muted/60 animate-pulse shrink-0" />
                <div className="h-4 flex-1 rounded bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-4 pb-5 pt-2 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-muted/35 text-muted-foreground">
              <Circle className="size-8" />
            </div>
            <p className="mt-3 text-[18px] font-semibold">{t("tasks.empty")}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t("tasks.addPlaceholder")}
            </p>
          </div>
        ) : (
          <div className="space-y-2 px-3 pb-3">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 rounded-2xl border border-border/30 bg-background/45 px-3 py-3 transition-colors hover:bg-accent/20"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task)}
                    disabled={togglingId === task.id}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="size-6 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="size-6" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-[15px]",
                      task.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task)}
                    disabled={deletingId === task.id}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title={t("tasks.delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-[30px] border border-border/30 bg-card/95 shadow-[0_12px_34px_rgba(0,0,0,0.22)]"
        >
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.03em]">
                  {t("activity.lastPayments")}
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  {t("courier.onlyOwnActivity")}
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[12px] font-medium text-emerald-400">
                {payments.length}
              </div>
            </div>
          </div>
          {paymentsLoading ? (
            <div className="space-y-2 px-4 pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border/30 bg-background/40 px-3 py-3"
                >
                  <div className="size-8 rounded-lg bg-muted/60 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-3/4 rounded bg-muted/60 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-muted/60 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="px-4 pb-5 pt-2 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-muted/35 text-muted-foreground">
                <Wallet className="size-8" />
              </div>
              <p className="mt-3 text-[18px] font-semibold">{t("activity.empty")}</p>
            </div>
          ) : (
            <div className="space-y-2 px-3 pb-3">
              {payments.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/30 bg-background/45 px-3 py-3 transition-colors hover:bg-accent/20"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                      item.type === "payment"
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/25 bg-amber-500/10 text-amber-400"
                    )}
                  >
                    {item.type === "payment" ? (
                      <Plus className="size-4 stroke-[2.7]" />
                    ) : (
                      <Minus className="size-4 stroke-[2.7]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">
                      {item.shop?.name ?? "—"} ·{" "}
                      {Number(item.amount ?? "0").toLocaleString("ru-RU", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USD
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {item.type === "payment"
                        ? t("activity.payment")
                        : t("activity.debt")}{" "}
                      · {formatDateSafe(item.createdAt, "d MMM, HH:mm", locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
