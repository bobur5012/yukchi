"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/useTranslations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsStore, DEFAULT_TEMPLATES, type MessageTemplates } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import {
  getTelegramSettings,
  updateTelegramSettings,
  checkTelegramConnection,
  getTelegramClientSettings,
  updateTelegramClientSettings,
  sendTelegramClientCode,
  verifyTelegramClientCode,
  verifyTelegramClientPassword,
  disconnectTelegramClient,
  getTelegramClientLogs,
  type TelegramClientLog,
  getMessageTemplates,
  updateMessageTemplates,
} from "@/lib/api/settings";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { sendTestPush } from "@/lib/api/push";
import { CheckCircle, XCircle, LogOut, Bell, BellOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type TelegramClientStatus =
  | "disconnected"
  | "pending_code"
  | "password_required"
  | "connected"
  | "error";

interface TelegramClientFormState {
  appId: string;
  appHash: string;
  phone: string;
  code: string;
  password: string;
  status: TelegramClientStatus;
  connected: boolean;
  hasSession: boolean;
  lastError?: string;
  isCodeViaApp?: boolean;
}

interface SettingsContentProps {
  role?: "admin" | "courier";
  hideNotifications?: boolean;
}

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

const TEMPLATE_META: Array<{
  key: keyof MessageTemplates;
  labelKey: string;
  vars: string;
}> = [
  {
    key: "newDebt",
    labelKey: "settings.templateNewDebt",
    vars: "{shop}, {amount}, {currency}, {totalDebt}, {courier}, {date}",
  },
  {
    key: "paymentReceived",
    labelKey: "settings.templatePaymentReceived",
    vars: "{shop}, {amount}, {currency}, {courier}, {remainingDebt}, {date}",
  },
  {
    key: "newTrip",
    labelKey: "settings.templateNewTrip",
    vars: "{name}, {region}, {budget}, {currency}, {couriers}, {departureDate}",
  },
  {
    key: "tripUpdated",
    labelKey: "settings.templateTripUpdated",
    vars: "{name}, {status}, {courier}",
  },
  {
    key: "newExpense",
    labelKey: "settings.templateNewExpense",
    vars: "{trip}, {description}, {amount}, {currency}, {courier}",
  },
  {
    key: "tripExpense",
    labelKey: "settings.templateTripExpense",
    vars: "{trip}, {description}, {amount}, {currency}, {courier}, {date}",
  },
  {
    key: "tripIncome",
    labelKey: "settings.templateTripIncome",
    vars: "{trip}, {description}, {amount}, {currency}, {courier}, {date}",
  },
  {
    key: "newProduct",
    labelKey: "settings.templateNewProduct",
    vars: "{trip}, {shop}, {name}, {quantity}, {unit}, {saleLine}, {deliveryLine}, {totalSale}, {totalDelivery}, {grandTotal}, {currencyShort}, {addedBy}, {createdAt}",
  },
  {
    key: "newShop",
    labelKey: "settings.templateNewShop",
    vars: "{name}, {owner}, {phone}, {address}",
  },
  {
    key: "newCourier",
    labelKey: "settings.templateNewCourier",
    vars: "{name}, {phone}",
  },
  {
    key: "courierAssigned",
    labelKey: "settings.templateCourierAssigned",
    vars: "{trip}, {courier}",
  },
  {
    key: "tripReminder",
    labelKey: "settings.templateTripReminder",
    vars: "{trip}, {departureDate}, {days}",
  },
];

export function SettingsContent({ role = "admin", hideNotifications = false }: SettingsContentProps) {
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
  const [telegramClient, setTelegramClient] = useState<TelegramClientFormState>({
    appId: "",
    appHash: "",
    phone: "",
    code: "",
    password: "",
    status: "disconnected",
    connected: false,
    hasSession: false,
  });
  const [telegramClientLogs, setTelegramClientLogs] = useState<TelegramClientLog[]>([]);
  const [savingTelegramClient, setSavingTelegramClient] = useState(false);
  const [sendingClientCode, setSendingClientCode] = useState(false);
  const [verifyingClientCode, setVerifyingClientCode] = useState(false);
  const [verifyingClientPassword, setVerifyingClientPassword] = useState(false);
  const [disconnectingClient, setDisconnectingClient] = useState(false);
  const [loadingClientLogs, setLoadingClientLogs] = useState(false);
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

      getTelegramClientSettings()
        .then((r) =>
          setTelegramClient((prev) => ({
            ...prev,
            appId: r.appId ?? "",
            appHash: r.appHash ?? "",
            phone: r.phone ?? "",
            status: r.status,
            connected: r.connected,
            hasSession: r.hasSession,
            lastError: r.lastError,
            isCodeViaApp: r.isCodeViaApp,
          }))
        )
        .catch(() => {});

      getTelegramClientLogs()
        .then((logs) => setTelegramClientLogs(logs))
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

  const applyTelegramClientResponse = (response: {
    appId?: string;
    appHash?: string;
    phone?: string;
    status: TelegramClientStatus;
    connected: boolean;
    hasSession: boolean;
    lastError?: string;
    isCodeViaApp?: boolean;
  }) => {
    setTelegramClient((prev) => ({
      ...prev,
      appId: response.appId ?? prev.appId,
      appHash: response.appHash ?? prev.appHash,
      phone: response.phone ?? prev.phone,
      status: response.status,
      connected: response.connected,
      hasSession: response.hasSession,
      lastError: response.lastError,
      isCodeViaApp: response.isCodeViaApp,
      code: response.status === "connected" ? "" : prev.code,
      password: response.status === "connected" ? "" : prev.password,
    }));
  };

  const loadTelegramClientLogs = async () => {
    setLoadingClientLogs(true);
    try {
      setTelegramClientLogs(await getTelegramClientLogs());
    } finally {
      setLoadingClientLogs(false);
    }
  };

  const handleSaveTelegramClient = async () => {
    setSavingTelegramClient(true);
    try {
      const result = await updateTelegramClientSettings({
        appId: telegramClient.appId,
        appHash: telegramClient.appHash,
        phone: telegramClient.phone,
      });
      applyTelegramClientResponse(result);
      toast.success(t("settings.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.saveError"));
    } finally {
      setSavingTelegramClient(false);
    }
  };

  const handleSendTelegramClientCode = async () => {
    setSendingClientCode(true);
    try {
      const result = await sendTelegramClientCode({
        appId: telegramClient.appId,
        appHash: telegramClient.appHash,
        phone: telegramClient.phone,
      });
      applyTelegramClientResponse(result);
      toast.success(t("settings.pending"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.error"));
    } finally {
      setSendingClientCode(false);
    }
  };

  const handleVerifyTelegramClientCode = async () => {
    setVerifyingClientCode(true);
    try {
      const result = await verifyTelegramClientCode(telegramClient.code);
      applyTelegramClientResponse(result);
      if (result.status === "password_required") {
        toast.success(t("settings.passwordRequired"));
      } else {
        toast.success(t("settings.authorized"));
        await loadTelegramClientLogs();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.error"));
    } finally {
      setVerifyingClientCode(false);
    }
  };

  const handleVerifyTelegramClientPassword = async () => {
    setVerifyingClientPassword(true);
    try {
      const result = await verifyTelegramClientPassword(telegramClient.password);
      applyTelegramClientResponse(result);
      toast.success(t("settings.authorized"));
      await loadTelegramClientLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.error"));
    } finally {
      setVerifyingClientPassword(false);
    }
  };

  const handleDisconnectTelegramClient = async () => {
    setDisconnectingClient(true);
    try {
      const result = await disconnectTelegramClient();
      applyTelegramClientResponse(result);
      toast.success(t("settings.disconnected"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.error"));
    } finally {
      setDisconnectingClient(false);
    }
  };

  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    try {
      await updateMessageTemplates(messageTemplates);
      toast.success(t("settings.templatesSaved"));
    } catch {
      toast.success(t("settings.templatesSavedLocal"));
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleResetTemplates = () => {
    setMessageTemplates(DEFAULT_TEMPLATES);
    toast.success(t("settings.templatesReset"));
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
      {!hideNotifications && (
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
      )}

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

      {role === "admin" && (
        <SectionCard title={t("settings.telegramClient")}>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">{t("settings.appId")}</label>
            <Input
              placeholder="12345678"
              value={telegramClient.appId}
              onChange={(e) => setTelegramClient((prev) => ({ ...prev, appId: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">{t("settings.hash")}</label>
            <Input
              placeholder="abcdef1234567890abcdef1234567890"
              value={telegramClient.appHash}
              onChange={(e) => setTelegramClient((prev) => ({ ...prev, appHash: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">{t("settings.phoneNumber")}</label>
            <Input
              placeholder="+998901234567"
              value={telegramClient.phone}
              onChange={(e) => setTelegramClient((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-[44px] rounded-[13px]"
              onClick={handleSaveTelegramClient}
              disabled={savingTelegramClient}
            >
              {savingTelegramClient ? "..." : t("settings.save")}
            </Button>
            <Button
              variant="outline"
              className="h-[44px] rounded-[13px]"
              onClick={handleSendTelegramClientCode}
              disabled={sendingClientCode}
            >
              {sendingClientCode ? "..." : t("settings.sendCode")}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {telegramClient.connected
              ? <CheckCircle className="size-4 text-emerald-500" />
              : telegramClient.status === "error"
                ? <XCircle className="size-4 text-destructive" />
                : <XCircle className="size-4 text-muted-foreground" />}
            <span className="text-[14px] text-muted-foreground">
              {telegramClient.status === "connected"
                ? t("settings.authorized")
                : telegramClient.status === "pending_code"
                  ? t("settings.pending")
                  : telegramClient.status === "password_required"
                    ? t("settings.passwordRequired")
                    : telegramClient.status === "error"
                      ? t("settings.error")
                      : t("settings.notAuthorized")}
            </span>
          </div>

          {telegramClient.lastError && (
            <p className="text-[12px] text-destructive">{telegramClient.lastError}</p>
          )}

          {(telegramClient.status === "pending_code" || telegramClient.status === "password_required") && (
            <div className="space-y-3 rounded-2xl border border-border/30 bg-muted/20 p-3">
              {telegramClient.status === "pending_code" && (
                <>
                  <div>
                    <label className="text-[13px] text-muted-foreground block mb-1">{t("settings.code")}</label>
                    <Input
                      placeholder={t("settings.codePlaceholder")}
                      value={telegramClient.code}
                      onChange={(e) => setTelegramClient((prev) => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full h-[44px] rounded-[13px]"
                    onClick={handleVerifyTelegramClientCode}
                    disabled={verifyingClientCode}
                  >
                    {verifyingClientCode ? "..." : t("settings.verifyCode")}
                  </Button>
                </>
              )}

              {telegramClient.status === "password_required" && (
                <>
                  <div>
                    <label className="text-[13px] text-muted-foreground block mb-1">{t("settings.password")}</label>
                    <Input
                      type="password"
                      placeholder={t("settings.passwordPlaceholder")}
                      value={telegramClient.password}
                      onChange={(e) => setTelegramClient((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full h-[44px] rounded-[13px]"
                    onClick={handleVerifyTelegramClientPassword}
                    disabled={verifyingClientPassword}
                  >
                    {verifyingClientPassword ? "..." : t("settings.verifyPassword")}
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-[44px] rounded-[13px]"
              onClick={loadTelegramClientLogs}
              disabled={loadingClientLogs}
            >
              {loadingClientLogs ? "..." : t("settings.refreshLogs")}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-[44px] rounded-[13px]"
              onClick={handleDisconnectTelegramClient}
              disabled={disconnectingClient}
            >
              {disconnectingClient ? "..." : t("settings.disconnect")}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-medium">{t("settings.logs")}</p>
            {telegramClientLogs.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">{t("settings.noLogs")}</p>
            ) : (
              telegramClientLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-border/30 bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-medium">{log.phone}</span>
                    <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed">{log.message}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t("common.status")}: {log.status}
                    {log.error ? ` • ${log.error}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      )}

      {/* Telegram message templates */}
      {role === "admin" && (
        <SectionCard title={t("settings.templatesTitle")}>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {t("settings.templatesHint")}
          </p>

          {TEMPLATE_META.map(({ key, labelKey, vars }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[13px] font-medium block">{t(labelKey)}</label>
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
