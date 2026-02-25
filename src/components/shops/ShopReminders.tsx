"use client";

import { useEffect, useState } from "react";
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  type ShopReminder,
} from "@/lib/api/shops";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateSafe } from "@/lib/date-utils";
import { Bell, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ShopRemindersProps {
  shopId: string;
}

export function ShopReminders({ shopId }: ShopRemindersProps) {
  const [reminders, setReminders] = useState<ShopReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState<"monthly" | "one_time">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState<string>("1");
  const [reminderAt, setReminderAt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    getReminders(shopId).then(setReminders).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [shopId]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await createReminder(shopId, {
        type,
        dayOfMonth: type === "monthly" ? parseInt(dayOfMonth, 10) : undefined,
        reminderAt: type === "one_time" && reminderAt ? reminderAt : undefined,
        enabled: true,
      });
      setAddOpen(false);
      setType("monthly");
      setDayOfMonth("1");
      setReminderAt("");
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (r: ShopReminder) => {
    await updateReminder(shopId, r.id, { enabled: !r.enabled });
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(shopId, id);
    load();
  };

  if (loading) {
    return (
      <Card className="rounded-2xl card-premium">
        <CardContent className="py-8 animate-pulse" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="section-title">Напоминания</p>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card className="rounded-2xl card-premium">
          <CardContent className="py-8">
            <EmptyState
              icon={Bell}
              title="Нет напоминаний"
              description="Добавьте напоминание о долге"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <Card key={r.id} className="rounded-2xl card-premium">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[15px]">
                    {r.type === "monthly"
                      ? `Ежемесячно, ${r.dayOfMonth} число`
                      : r.reminderAt
                        ? `Одноразово: ${formatDateSafe(r.reminderAt, "d MMM yyyy", "ru")}`
                        : "Одноразово"}
                  </p>
                  {r.lastSentAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Отправлено: {formatDateSafe(r.lastSentAt, "d MMM yyyy", "ru")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={() => handleToggle(r)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Добавить напоминание</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-4 pb-6">
            <div>
              <p className="text-sm font-medium mb-1.5">Тип</p>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "monthly" | "one_time")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Ежемесячно</SelectItem>
                  <SelectItem value="one_time">Одноразово</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "monthly" && (
              <div>
                <p className="text-sm font-medium mb-1.5">День месяца (1–28)</p>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                />
              </div>
            )}
            {type === "one_time" && (
              <div>
                <p className="text-sm font-medium mb-1.5">Дата и время</p>
                <Input
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                />
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={
                submitting ||
                (type === "monthly" && (!dayOfMonth || parseInt(dayOfMonth, 10) < 1 || parseInt(dayOfMonth, 10) > 28)) ||
                (type === "one_time" && !reminderAt)
              }
            >
              {submitting ? "Сохранение…" : "Добавить"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
