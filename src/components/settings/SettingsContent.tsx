"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/useTranslations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore, DEFAULT_TEMPLATES, type MessageTemplates } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import {
  getTelegramSettings,
  updateTelegramSettings,
  checkTelegramConnection,
  getMessageTemplates,
  updateMessageTemplates,
} from "@/lib/api/settings";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { sendTestPush } from "@/lib/api/push";
import { CheckCircle, XCircle, LogOut, Bell, BellOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface SettingsContentProps { role?: "admin" | "courier" }

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
      <div className="px-4 pt-4 pb-1">
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.07em]">{title}</p>
      </div>
      <div className="px-4 pb-4 pt-2 space-y-3">{children}</div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between min-h-[44px]">
      <span className="text-[16px]">{label}</span>
      {children}
    </div>
  );
}

const TEMPLATE_META: Array<{
  key: keyof MessageTemplates;
  label: string;
  vars: string;
}> = [
  {
    key: "newDebt",
    label: "🔴 Новый долг",
    vars: "{shop}, {amount}, {currency}, {courier}, {description}, {totalDebt}, {date}",
  },
  {
    key: "paymentReceived",
    label: "✅ Оплата получена",
    vars: "{shop}, {amount}, {currency}, {courier}, {remainingDebt}, {date}",
  },
  {
    key: "newTrip",
    label: "✈️ Новая поездка",
    vars: "{name}, {region}, {budget}, {currency}, {couriers}, {departureDate}",
  },
  {
    key: "tripUpdated",
    label: "✏️ Поездка обновлена",
    vars: "{name}, {status}, {courier}",
  },
  {
    key: "newExpense",
    label: "💸 Новый расход",
    vars: "{trip}, {description}, {amount}, {currency}, {courier}",
  },
  {
    key: "newProduct",
    label: "📦 Новый товар",
    vars: "{trip}, {shop}, {name}, {quantity}, {unit}, {salePrice}, {pricePerKg}, {deliveryMode}, {deliveryPrice}, {totalSale}, {totalDelivery}, {grandTotal}, {addedBy}, {createdAt}, {currency}",
  },
  {
    key: "newShop",
    label: "🏪 Новый магазин",
    vars: "{name}, {owner}, {phone}, {address}",
  },
  {
    key: "newCourier",
    label: "🚀 Новый курьер",
    vars: "{name}, {phone}",
  },
  {
    key: "courierAssigned",
    label: "🔗 Курьер назначен",
    vars: "{trip}, {courier}",
  },
  {
    key: "tripReminder",
    label: "⏰ Напоминание о поездке",
    vars: "{trip}, {departureDate}, {days}",
  },
];

export function SettingsContent({ role = "admin" }: SettingsContentProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const {
    telegramBot,
    messageTemplates,
    setTelegramBot,
    setMessageTemplate,
    setMessageTemplates,
  } = useSettingsStore();
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const push = usePushNotifications();

  useEffect(() => {
    if (role === "admin") {
      getTelegramSettings()
        .then((r) =>
          setTelegramBot({
            token: r.token ?? "",
            chatId: r.chatId ?? "",
            status: r.status === "configured" ? "connected" : "disconnected",
          })
        )
        .catch(() => {});

      getMessageTemplates()
        .then((r) => setMessageTemplates(r as Partial<MessageTemplates>))
        .catch(() => {});
    }
  }, [role, setTelegramBot, setMessageTemplates]);


  const handleLogout = () => { logout(); router.replace("/login"); };

  const handleSaveTelegramBot = async () => {
    setSaving(true);
    try {
      await updateTelegramSettings({ token: telegramBot.token || undefined, chatId: telegramBot.chatId || undefined });
      setTelegramBot({ status: telegramBot.token && telegramBot.chatId ? "connected" : "disconnected" });
      toast.success(t("settings.saved"));
    } catch {
      toast.error(t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    try {
      await updateMessageTemplates(messageTemplates);
      toast.success("Шаблоны сохранены");
    } catch {
      toast.success("Шаблоны сохранены локально");
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleResetTemplates = () => {
    setMessageTemplates(DEFAULT_TEMPLATES);
    toast.success("Шаблоны сброшены к стандартным");
  };

  const handleEnablePush = async () => {
    const ok = await push.subscribe();
    if (ok) toast.success(t("push.enabled"));
    else if (push.permission === "denied") toast.error(t("push.permissionDenied"));
    else toast.error(t("push.error"));
  };

  const handleDisablePush = async () => {
    const ok = await push.unsubscribe();
    if (ok) toast.success(t("push.disabled"));
    else toast.error(t("push.error"));
  };

  const handleSendTestPush = async () => {
    setSendingTest(true);
    try {
      await sendTestPush();
      toast.success(t("push.testSent"));
    } catch {
      toast.error(t("push.error"));
    } finally {
      setSendingTest(false);
    }
  };

  const handleCheckConnection = async () => {
    setChecking(true);
    setTelegramBot({ status: "disconnected" });
    try {
      const res = await checkTelegramConnection(
        telegramBot.token && telegramBot.chatId ? { token: telegramBot.token, chatId: telegramBot.chatId } : undefined
      );
      setTelegramBot({ status: res.success ? "connected" : "error" });
      if (res.success) toast.success(t("settings.connected"));
      else toast.error(res.error ?? t("settings.error"));
    } catch {
      setTelegramBot({ status: "error" });
      toast.error(t("settings.error"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Push & Notifications */}
      <SectionCard title={t("settings.notifications")}>
        {push.isSupported && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[16px]">{t("push.title")}</span>
              <div className="flex gap-2">
                {push.isSubscribed ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl"
                      onClick={handleSendTestPush}
                      disabled={sendingTest}
                    >
                      {sendingTest ? "..." : t("push.sendTest")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl"
                      onClick={handleDisablePush}
                      disabled={push.loading}
                    >
                      <BellOff className="size-4 mr-1" />
                      {t("push.disable")}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl"
                    onClick={handleEnablePush}
                    disabled={push.loading}
                  >
                    <Bell className="size-4 mr-1" />
                    {t("push.enable")}
                  </Button>
                )}
              </div>
            </div>
            {push.permission === "denied" && (
              <p className="text-[13px] text-muted-foreground">{t("push.permissionDenied")}</p>
            )}
          </>
        )}
      </SectionCard>

      {role === "admin" && (
        <SectionCard title={t("settings.telegramBot")}>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">{t("settings.token")}</label>
            <Input placeholder="123456:ABC..." value={telegramBot.token} onChange={(e) => setTelegramBot({ token: e.target.value })} />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">{t("settings.chatId")}</label>
            <Input placeholder="-1001234567890" value={telegramBot.chatId} onChange={(e) => setTelegramBot({ chatId: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-[44px] rounded-[13px]" onClick={handleSaveTelegramBot} disabled={saving}>
              {saving ? "..." : t("settings.save")}
            </Button>
            <Button variant="outline" className="flex-1 h-[44px] rounded-[13px]" onClick={handleCheckConnection} disabled={checking}>
              {checking ? "..." : t("settings.checkConnection")}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {telegramBot.status === "connected"
              ? <CheckCircle className="size-4 text-emerald-500" />
              : <XCircle className="size-4 text-muted-foreground" />}
            <span className="text-[14px] text-muted-foreground">
              {telegramBot.status === "connected" ? t("settings.connected") : telegramBot.status === "error" ? t("settings.error") : t("settings.notConnected")}
            </span>
          </div>
        </SectionCard>
      )}

      {/* Telegram message templates */}
      {role === "admin" && (
        <SectionCard title={t("settings.templatesTitle")}>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {t("settings.templatesHint")}
          </p>

          {TEMPLATE_META.map(({ key, label, vars }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[13px] font-medium block">{label}</label>
              <Textarea
                rows={4}
                value={messageTemplates[key] ?? ""}
                onChange={(e) => setMessageTemplate(key, e.target.value)}
                className="text-[13px] font-mono leading-snug"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-medium">{t("settings.variables")}:</span> {vars}
              </p>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 h-[44px] rounded-[13px]"
              onClick={handleSaveTemplates}
              disabled={savingTemplates}
            >
              {savingTemplates ? t("settings.savingTemplates") : t("settings.saveTemplates")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-[44px] rounded-[13px] shrink-0"
              onClick={handleResetTemplates}
              title={t("settings.resetToDefaults")}
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </SectionCard>
      )}

      {/* Logout */}
      <div className="bg-card rounded-2xl border border-border/30 p-4">
        <Button
          variant="ghost"
          className="w-full h-[44px] rounded-[13px] text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="size-4 mr-2" />
          {t("settings.logout")}
        </Button>
      </div>
    </div>
  );
}
