"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import { CheckCircle, XCircle, LogOut } from "lucide-react";

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

export function SettingsContent({ role = "admin" }: SettingsContentProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const {
    telegramBot, telegramClient, notifications, messageTemplates,
    setTelegramBot, setTelegramClient, setNotifications, setMessageTemplate,
  } = useSettingsStore();

  const handleLogout = () => { logout(); router.replace("/login"); };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      <SectionCard title="Уведомления">
        <SettingRow label="Новый долг">
          <Switch checked={notifications.newDebt} onCheckedChange={(v) => setNotifications({ newDebt: v })} />
        </SettingRow>
        <SettingRow label="Получена оплата">
          <Switch checked={notifications.paymentReceived} onCheckedChange={(v) => setNotifications({ paymentReceived: v })} />
        </SettingRow>
        <SettingRow label="Напоминание о поездке">
          <Switch checked={notifications.tripReminder} onCheckedChange={(v) => setNotifications({ tripReminder: v })} />
        </SettingRow>
      </SectionCard>

      {role === "admin" && (
        <SectionCard title="Telegram Bot">
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">Token</label>
            <Input placeholder="123456:ABC..." value={telegramBot.token} onChange={(e) => setTelegramBot({ token: e.target.value })} />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">Chat ID</label>
            <Input placeholder="-1001234567890" value={telegramBot.chatId} onChange={(e) => setTelegramBot({ chatId: e.target.value })} />
          </div>
          <Button variant="outline" className="w-full h-[44px] rounded-[13px]">Проверить подключение</Button>
          <div className="flex items-center gap-2">
            {telegramBot.status === "connected"
              ? <CheckCircle className="size-4 text-emerald-500" />
              : <XCircle className="size-4 text-muted-foreground" />}
            <span className="text-[14px] text-muted-foreground">
              {telegramBot.status === "connected" ? "Подключено" : telegramBot.status === "error" ? "Ошибка" : "Не подключено"}
            </span>
          </div>
        </SectionCard>
      )}

      {role === "admin" && (
        <SectionCard title="Telegram Client">
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">Номер телефона</label>
            <PhoneInput value={telegramClient.phone} onChange={(v) => setTelegramClient({ phone: v })} />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">App ID</label>
            <Input placeholder="12345678" value={telegramClient.appId} onChange={(e) => setTelegramClient({ appId: e.target.value })} />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">Hash</label>
            <Input placeholder="abcdef123456..." value={telegramClient.appHash} onChange={(e) => setTelegramClient({ appHash: e.target.value })} />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">Код</label>
            <Input placeholder="Код из Telegram" value={telegramClient.code} onChange={(e) => setTelegramClient({ code: e.target.value })} />
          </div>
          <Button variant="outline" className="w-full h-[44px] rounded-[13px]">Войти</Button>
          <div className="flex items-center gap-2">
            {telegramClient.status === "authorized"
              ? <CheckCircle className="size-4 text-emerald-500" />
              : <XCircle className="size-4 text-muted-foreground" />}
            <span className="text-[14px] text-muted-foreground">
              {telegramClient.status === "authorized" ? "Авторизован" : telegramClient.status === "pending" ? "Ожидание кода" : "Не авторизован"}
            </span>
          </div>
        </SectionCard>
      )}

      {role === "admin" && (
        <SectionCard title="Шаблоны сообщений">
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">Новый долг</label>
            <Input value={messageTemplates.newDebt} onChange={(e) => setMessageTemplate("newDebt", e.target.value)} placeholder="{shop}, {amount}, {currency}" />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">Получена оплата</label>
            <Input value={messageTemplates.paymentReceived} onChange={(e) => setMessageTemplate("paymentReceived", e.target.value)} placeholder="{shop}, {amount}" />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">Напоминание о поездке</label>
            <Input value={messageTemplates.tripReminder} onChange={(e) => setMessageTemplate("tripReminder", e.target.value)} placeholder="{trip}, {days}" />
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
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
