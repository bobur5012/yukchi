"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, CheckCircle2, Trash2, Plus, Wallet, CreditCard } from "lucide-react";
import { CurrencyWidget } from "./CurrencyWidget";
import { TopCouriers } from "./TopCouriers";
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
import { formatDateSafe } from "@/lib/date-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 p-6">
      <CurrencyWidget />

      {/* Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border/30 overflow-hidden"
      >
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-[17px] font-semibold">{t("tasks.title")}</h2>
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <Input
              placeholder={t("tasks.addPlaceholder")}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim() || addingTask}
            >
              <Plus className="size-5" />
            </Button>
          </div>
        </div>

        {tasksLoading ? (
          <div className="px-4 pb-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2"
              >
                <div className="size-6 rounded-full bg-muted/60 animate-pulse shrink-0" />
                <div className="h-4 flex-1 rounded bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={Circle}
            title={t("tasks.empty")}
            className="py-8"
          />
        ) : (
          <div className="divide-y divide-border/30">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors"
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
                      "flex-1 text-[15px] truncate",
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

      {/* Last payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card border border-border/30 overflow-hidden"
      >
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-[17px] font-semibold">
            {t("activity.lastPayments")}
          </h2>
        </div>
        {paymentsLoading ? (
          <div className="px-4 pb-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2"
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
          <EmptyState
            icon={Wallet}
            title={t("activity.empty")}
            className="py-8"
          />
        ) : (
          <div className="divide-y divide-border/30">
            {payments.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors"
              >
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {item.type === "payment" ? (
                    <CreditCard className="size-4 text-emerald-500" />
                  ) : (
                    <Wallet className="size-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate">
                    {item.shop?.name ?? "—"} · {item.amount ?? "0"} USD
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

      <TopCouriers />
    </div>
  );
}
