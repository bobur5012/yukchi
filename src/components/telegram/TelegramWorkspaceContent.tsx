"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, MessageSquareText, RotateCcw, Send, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/auth";
import { DEFAULT_TEMPLATES, type MessageTemplates, useSettingsStore } from "@/stores/settings";
import { useTranslations } from "@/lib/useTranslations";
import {
  checkTelegramConnection,
  disconnectTelegramClient,
  getMessageTemplates,
  getTelegramClientSettings,
  getTelegramSettings,
  sendTelegramClientCode,
  updateMessageTemplates,
  updateTelegramClientSettings,
  updateTelegramSettings,
  verifyTelegramClientCode,
  verifyTelegramClientPassword,
} from "@/lib/api/settings";
import {
  getNotificationLogs,
  sendBotTestMessage,
  type NotificationLogEntry,
  type NotificationLogListResponse,
} from "@/lib/api/notifications";

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
  rateLimitPerMinute: number;
  code: string;
  password: string;
  status: TelegramClientStatus;
  connected: boolean;
  hasSession: boolean;
  lastError?: string;
  isCodeViaApp?: boolean;
}

const REPORTS_PAGE_SIZE = 20;

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

const DEBTOR_TEMPLATE_META: Array<{
  key: keyof MessageTemplates;
  labelKey: string;
  vars: string;
}> = [
  {
    key: "debtorNewDebtor",
    labelKey: "telegram.debtorNewDebtor",
    vars: "{owner}, {shop}, {debt}, {currency}",
  },
  {
    key: "debtorDebtAdded",
    labelKey: "telegram.debtorDebtAdded",
    vars: "{owner}, {shop}, {amount}, {currency}, {previousDebt}, {debt}",
  },
  {
    key: "debtorPaymentReceived",
    labelKey: "telegram.debtorPaymentReceived",
    vars: "{owner}, {shop}, {amount}, {currency}, {remainingDebt}",
  },
];

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/30 bg-card">
      <div className="px-4 pb-1 pt-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">{title}</p>
      </div>
      <div className="space-y-3 px-4 pb-4 pt-2">{children}</div>
    </div>
  );
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function buildTelegramPreview(message?: string | null): string {
  if (!message) return "-";

  return message
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/^_{10,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildClientRecipient(log: NotificationLogEntry): string {
  const parts = [log.shop?.name, log.shop?.phone].filter((value): value is string => Boolean(value?.trim()));
  return parts.length > 0 ? parts.join(" - ") : "-";
}

function buildPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 1) return [1];
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (!pages.includes(1)) {
    pages.unshift(1);
  }
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }
  return [...new Set(pages)];
}

export function TelegramWorkspaceContent() {
  const { t } = useTranslations();
  const userRole = useAuthStore((state) => state.user?.role);
  const { telegramBot, messageTemplates, setTelegramBot, setMessageTemplate, setMessageTemplates } = useSettingsStore();

  const [checking, setChecking] = useState(false);
  const [savingBot, setSavingBot] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [savingTelegramClient, setSavingTelegramClient] = useState(false);
  const [sendingClientCode, setSendingClientCode] = useState(false);
  const [verifyingClientCode, setVerifyingClientCode] = useState(false);
  const [verifyingClientPassword, setVerifyingClientPassword] = useState(false);
  const [disconnectingClient, setDisconnectingClient] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [currentReportsPage, setCurrentReportsPage] = useState(1);
  const [telegramClient, setTelegramClient] = useState<TelegramClientFormState>({
    appId: "",
    appHash: "",
    phone: "",
    rateLimitPerMinute: 1,
    code: "",
    password: "",
    status: "disconnected",
    connected: false,
    hasSession: false,
  });
  const [clientReports, setClientReports] = useState<NotificationLogListResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: REPORTS_PAGE_SIZE,
  });

  const totalReportPages = Math.max(1, Math.ceil(clientReports.total / Math.max(1, clientReports.limit || REPORTS_PAGE_SIZE)));
  const visiblePages = buildPageNumbers(currentReportsPage, totalReportPages);

  const applyTelegramClientResponse = (response: {
    appId?: string;
    appHash?: string;
    phone?: string;
    rateLimitPerMinute?: number;
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
      rateLimitPerMinute: response.rateLimitPerMinute ?? prev.rateLimitPerMinute,
      status: response.status,
      connected: response.connected,
      hasSession: response.hasSession,
      lastError: response.lastError,
      isCodeViaApp: response.isCodeViaApp,
      code: response.status === "pending_code" ? prev.code : "",
      password: response.status === "password_required" ? prev.password : "",
    }));
  };

  const loadReports = useCallback(
    async (page = currentReportsPage) => {
      setLoadingReports(true);
      try {
        const response = await getNotificationLogs({
          channel: "client",
          page,
          limit: REPORTS_PAGE_SIZE,
        });
        setClientReports(response);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("common.loadError"));
      } finally {
        setLoadingReports(false);
      }
    },
    [currentReportsPage, t]
  );

  useEffect(() => {
    if (userRole !== "admin") return;

    getTelegramSettings()
      .then((response) =>
        setTelegramBot({
          token: response.token ?? "",
          chatId: response.chatId ?? "",
          status: response.status === "configured" ? "connected" : "disconnected",
        })
      )
      .catch(() => {});

    getMessageTemplates()
      .then((response) => setMessageTemplates(response as Partial<MessageTemplates>))
      .catch(() => {});

    getTelegramClientSettings()
      .then((response) =>
        setTelegramClient((prev) => ({
          ...prev,
          appId: response.appId ?? "",
          appHash: response.appHash ?? "",
          phone: response.phone ?? "",
          rateLimitPerMinute: response.rateLimitPerMinute ?? 1,
          status: response.status,
          connected: response.connected,
          hasSession: response.hasSession,
          lastError: response.lastError,
          isCodeViaApp: response.isCodeViaApp,
        }))
      )
      .catch(() => {});
  }, [setMessageTemplates, setTelegramBot, userRole]);

  useEffect(() => {
    if (userRole !== "admin") return;
    void loadReports(currentReportsPage);
  }, [currentReportsPage, loadReports, userRole]);

  const handleSaveTelegramBot = async () => {
    setSavingBot(true);
    try {
      await updateTelegramSettings({
        token: telegramBot.token || undefined,
        chatId: telegramBot.chatId || undefined,
      });
      setTelegramBot({ status: telegramBot.token && telegramBot.chatId ? "connected" : "disconnected" });
      toast.success(t("settings.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.saveError"));
    } finally {
      setSavingBot(false);
    }
  };

  const handleCheckConnection = async () => {
    setChecking(true);
    setTelegramBot({ status: "disconnected" });
    try {
      const response = await checkTelegramConnection(
        telegramBot.token && telegramBot.chatId ? { token: telegramBot.token, chatId: telegramBot.chatId } : undefined
      );
      setTelegramBot({ status: response.success ? "connected" : "error" });
      if (response.success) {
        toast.success(t("settings.connected"));
      } else {
        toast.error(response.error ?? t("settings.error"));
      }
    } catch (error) {
      setTelegramBot({ status: "error" });
      toast.error(error instanceof Error ? error.message : t("settings.error"));
    } finally {
      setChecking(false);
    }
  };

  const handleSendBotTest = async () => {
    setTestingBot(true);
    try {
      await sendBotTestMessage(`Yukchi test: ${new Date().toLocaleString()}`);
      toast.success(t("telegram.testSent"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.error"));
    } finally {
      setTestingBot(false);
    }
  };

  const handleSaveTelegramClient = async () => {
    setSavingTelegramClient(true);
    try {
      const result = await updateTelegramClientSettings({
        appId: telegramClient.appId,
        appHash: telegramClient.appHash,
        phone: telegramClient.phone.trim() || undefined,
        rateLimitPerMinute: telegramClient.rateLimitPerMinute,
      });
      applyTelegramClientResponse(result);
      toast.success(t("settings.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.saveError"));
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.error"));
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
      }
      await loadReports(currentReportsPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.error"));
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
      await loadReports(currentReportsPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.error"));
    } finally {
      setVerifyingClientPassword(false);
    }
  };

  const handleDisconnectTelegramClient = async () => {
    setDisconnectingClient(true);
    try {
      const result = await disconnectTelegramClient();
      applyTelegramClientResponse(result);
      toast.success(t("telegram.clientDisconnected"));
      await loadReports(currentReportsPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.error"));
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

  if (userRole !== "admin") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {t("telegram.adminOnly")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(135deg,rgba(94,92,230,0.14)_0%,rgba(28,28,34,0.96)_46%,rgba(16,16,20,0.98)_100%)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/14 text-primary">
            <MessageSquareText className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[22px] font-semibold tracking-[-0.04em]">{t("telegram.title")}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{t("telegram.description")}</p>
          </div>
        </div>
      </div>

      <SectionCard title={t("settings.telegramBot")}>
        <div>
          <label className="mb-1 block text-[13px] text-muted-foreground">{t("settings.token")}</label>
          <Input placeholder="123456:ABC..." value={telegramBot.token} onChange={(e) => setTelegramBot({ token: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-muted-foreground">{t("settings.chatId")}</label>
          <Input placeholder="-1001234567890" value={telegramBot.chatId} onChange={(e) => setTelegramBot({ chatId: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="h-[44px] rounded-[13px]" onClick={handleSaveTelegramBot} disabled={savingBot}>
            {savingBot ? "..." : t("settings.save")}
          </Button>
          <Button variant="outline" className="h-[44px] rounded-[13px]" onClick={handleCheckConnection} disabled={checking}>
            {checking ? "..." : t("settings.checkConnection")}
          </Button>
          <Button variant="outline" className="h-[44px] rounded-[13px]" onClick={handleSendBotTest} disabled={testingBot}>
            {testingBot ? "..." : t("telegram.testSend")}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {telegramBot.status === "connected" ? (
            <CheckCircle className="size-4 text-emerald-500" />
          ) : (
            <XCircle className={`size-4 ${telegramBot.status === "error" ? "text-destructive" : "text-muted-foreground"}`} />
          )}
          <span className="text-[14px] text-muted-foreground">
            {telegramBot.status === "connected"
              ? t("settings.connected")
              : telegramBot.status === "error"
                ? t("settings.error")
                : t("settings.notConnected")}
          </span>
        </div>
      </SectionCard>

      <SectionCard title={t("settings.telegramClient")}>
        <div>
          <label className="mb-1 block text-[13px] text-muted-foreground">{t("settings.appId")}</label>
          <Input
            placeholder="12345678"
            value={telegramClient.appId}
            onChange={(e) => setTelegramClient((prev) => ({ ...prev, appId: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-muted-foreground">{t("settings.hash")}</label>
          <Input
            placeholder="abcdef1234567890abcdef1234567890"
            value={telegramClient.appHash}
            onChange={(e) => setTelegramClient((prev) => ({ ...prev, appHash: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-muted-foreground">{t("settings.phoneNumber")}</label>
          <Input
            placeholder="+998901234567"
            value={telegramClient.phone}
            onChange={(e) => setTelegramClient((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-muted-foreground">{t("telegram.rateLimitLabel")}</label>
          <Input
            type="number"
            min={1}
            max={60}
            value={telegramClient.rateLimitPerMinute}
            onChange={(e) =>
              setTelegramClient((prev) => ({
                ...prev,
                rateLimitPerMinute: Math.max(1, Math.min(60, Number.parseInt(e.target.value || "1", 10) || 1)),
              }))
            }
          />
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {t("telegram.rateLimitHint")} {t("telegram.rateLimitRecommended")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-[44px] rounded-[13px]" onClick={handleSaveTelegramClient} disabled={savingTelegramClient}>
            {savingTelegramClient ? "..." : t("settings.save")}
          </Button>
          <Button variant="outline" className="h-[44px] rounded-[13px]" onClick={handleSendTelegramClientCode} disabled={sendingClientCode}>
            {sendingClientCode ? "..." : t("settings.sendCode")}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {telegramClient.connected ? (
            <CheckCircle className="size-4 text-emerald-500" />
          ) : telegramClient.status === "error" ? (
            <ShieldAlert className="size-4 text-destructive" />
          ) : (
            <XCircle className="size-4 text-muted-foreground" />
          )}
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

        {telegramClient.lastError ? <p className="text-[12px] text-destructive">{telegramClient.lastError}</p> : null}
        {telegramClient.isCodeViaApp ? <p className="text-[12px] text-muted-foreground">{t("telegram.codeViaApp")}</p> : null}

        {(telegramClient.status === "pending_code" || telegramClient.status === "password_required") && (
          <div className="space-y-3 rounded-2xl border border-border/30 bg-muted/20 p-3">
            {telegramClient.status === "pending_code" ? (
              <>
                <div>
                  <label className="mb-1 block text-[13px] text-muted-foreground">{t("settings.code")}</label>
                  <Input
                    placeholder={t("settings.codePlaceholder")}
                    value={telegramClient.code}
                    onChange={(e) => setTelegramClient((prev) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <Button className="h-[44px] w-full rounded-[13px]" onClick={handleVerifyTelegramClientCode} disabled={verifyingClientCode}>
                  {verifyingClientCode ? "..." : t("settings.verifyCode")}
                </Button>
              </>
            ) : null}

            {telegramClient.status === "password_required" ? (
              <>
                <div>
                  <label className="mb-1 block text-[13px] text-muted-foreground">{t("settings.password")}</label>
                  <Input
                    type="password"
                    placeholder={t("settings.passwordPlaceholder")}
                    value={telegramClient.password}
                    onChange={(e) => setTelegramClient((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <Button className="h-[44px] w-full rounded-[13px]" onClick={handleVerifyTelegramClientPassword} disabled={verifyingClientPassword}>
                  {verifyingClientPassword ? "..." : t("settings.verifyPassword")}
                </Button>
              </>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-[44px] rounded-[13px]" onClick={() => loadReports(currentReportsPage)} disabled={loadingReports}>
            {loadingReports ? "..." : t("telegram.refreshReports")}
          </Button>
          <Button variant="outline" className="h-[44px] rounded-[13px]" onClick={handleDisconnectTelegramClient} disabled={disconnectingClient}>
            {disconnectingClient ? "..." : t("telegram.disconnectClient")}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title={t("settings.templatesTitle")}>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{t("settings.templatesHint")}</p>

        {TEMPLATE_META.map(({ key, labelKey, vars }) => (
          <div key={key} className="space-y-1.5">
            <label className="block text-[13px] font-medium">{t(labelKey)}</label>
            <Textarea
              rows={4}
              value={messageTemplates[key] ?? ""}
              onChange={(e) => setMessageTemplate(key, e.target.value)}
              className="font-mono text-[13px] leading-snug"
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-medium">{t("settings.variables")}:</span> {vars}
            </p>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Button className="h-[44px] flex-1 rounded-[13px]" onClick={handleSaveTemplates} disabled={savingTemplates}>
            {savingTemplates ? t("settings.savingTemplates") : t("settings.saveTemplates")}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-[44px] shrink-0 rounded-[13px]"
            onClick={handleResetTemplates}
            title={t("settings.resetToDefaults")}
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </SectionCard>

      <SectionCard title={t("telegram.reportsTitle")}>
        <div className="space-y-2">
          {clientReports.items.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">{t("settings.noLogs")}</p>
          ) : (
            clientReports.items.map((log) => {
              const eventAt = log.sentAt ?? log.createdAt;
              return (
                <div key={log.id} className="rounded-2xl border border-border/30 bg-muted/20 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3 text-[12px]">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">{t("telegram.reportRecipient")}</p>
                      <p className="font-medium">{buildClientRecipient(log)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-muted-foreground">{t("telegram.reportDateTime")}</p>
                      <p>{formatDateTime(eventAt)}</p>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-[12px] leading-relaxed">{buildTelegramPreview(log.message)}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t("common.status")}: {log.status}
                    {log.error ? ` - ${log.error}` : ""}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {totalReportPages > 1 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="outline"
              className="h-[38px] rounded-[12px]"
              onClick={() => setCurrentReportsPage((page) => Math.max(1, page - 1))}
              disabled={currentReportsPage === 1 || loadingReports}
            >
              {t("telegram.prevPage")}
            </Button>
            {visiblePages.map((page) => (
              <Button
                key={page}
                variant={page === currentReportsPage ? "default" : "outline"}
                className="h-[38px] min-w-[38px] rounded-[12px] px-3"
                onClick={() => setCurrentReportsPage(page)}
                disabled={loadingReports}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-[38px] rounded-[12px]"
              onClick={() => setCurrentReportsPage((page) => Math.min(totalReportPages, page + 1))}
              disabled={currentReportsPage === totalReportPages || loadingReports}
            >
              {t("telegram.nextPage")}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {t("telegram.pageLabel")
                .replace("{{page}}", String(clientReports.page))
                .replace("{{total}}", String(totalReportPages))}
            </p>
          </div>
        ) : null}

        <Button variant="outline" className="h-[44px] w-full rounded-[13px]" onClick={() => loadReports(currentReportsPage)} disabled={loadingReports}>
          <Send className="mr-2 size-4" />
          {loadingReports ? "..." : t("telegram.refreshReports")}
        </Button>
      </SectionCard>

      <SectionCard title={t("telegram.debtorTemplatesTitle")}>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{t("telegram.debtorTemplatesHint")}</p>

        <div className="grid gap-3 md:grid-cols-3">
          {DEBTOR_TEMPLATE_META.map(({ key, labelKey, vars }) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-[13px] font-medium">{t(labelKey)}</label>
              <Textarea
                rows={6}
                value={messageTemplates[key] ?? ""}
                onChange={(e) => setMessageTemplate(key, e.target.value)}
                className="font-mono text-[13px] leading-snug"
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium">{t("settings.variables")}:</span> {vars}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="h-[44px] flex-1 rounded-[13px]" onClick={handleSaveTemplates} disabled={savingTemplates}>
            {savingTemplates ? t("settings.savingTemplates") : t("settings.saveTemplates")}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-[44px] shrink-0 rounded-[13px]"
            onClick={handleResetTemplates}
            title={t("settings.resetToDefaults")}
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
