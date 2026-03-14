import { api } from "./client";

export interface NotificationSettingsResponse {
  newTrip: boolean;
  tripUpdated: boolean;
  newExpense: boolean;
  newProduct: boolean;
  newShop: boolean;
  newDebt: boolean;
  paymentReceived: boolean;
  newCourier: boolean;
  courierAssigned: boolean;
  tripReminder: boolean;
}

export async function getNotificationSettings(): Promise<NotificationSettingsResponse> {
  return api.get<NotificationSettingsResponse>("/settings/notifications");
}

export async function updateNotificationSettings(
  data: Partial<NotificationSettingsResponse>
): Promise<NotificationSettingsResponse> {
  return api.put<NotificationSettingsResponse>("/settings/notifications", data);
}

export interface TelegramSettings {
  token?: string;
  chatId?: string;
  status: "configured" | "not_configured";
}

export interface TelegramClientSettings {
  appId?: string;
  appHash?: string;
  phone?: string;
  rateLimitPerMinute: number;
  status: "disconnected" | "pending_code" | "password_required" | "connected" | "error";
  connected: boolean;
  hasSession: boolean;
  pendingPhone?: string;
  lastError?: string;
  isCodeViaApp?: boolean;
  needsPassword?: boolean;
}

export interface TelegramClientLog {
  id: string;
  phone: string;
  message: string;
  messageId?: string | null;
  status: string;
  error?: string | null;
  floodWaitSeconds?: number | null;
  createdAt: string;
}

export async function getTelegramSettings(): Promise<TelegramSettings> {
  return api.get<TelegramSettings>("/settings/telegram");
}

export async function updateTelegramSettings(
  data: { token?: string; chatId?: string }
): Promise<TelegramSettings> {
  return api.put<TelegramSettings>("/settings/telegram", data);
}

export async function checkTelegramConnection(
  data?: { token?: string; chatId?: string }
): Promise<{ success: boolean; error?: string }> {
  return api.post<{ success: boolean; error?: string }>("/settings/telegram/check", data ?? {});
}

export async function getTelegramClientSettings(): Promise<TelegramClientSettings> {
  return api.get<TelegramClientSettings>("/settings/telegram-client");
}

export async function updateTelegramClientSettings(
  data: { appId: string; appHash: string; phone?: string; rateLimitPerMinute?: number }
): Promise<TelegramClientSettings> {
  return api.put<TelegramClientSettings>("/settings/telegram-client", data);
}

export async function sendTelegramClientCode(
  data: { appId?: string; appHash?: string; phone?: string }
): Promise<TelegramClientSettings> {
  return api.post<TelegramClientSettings>("/settings/telegram-client/send-code", data);
}

export async function verifyTelegramClientCode(code: string): Promise<TelegramClientSettings> {
  return api.post<TelegramClientSettings>("/settings/telegram-client/verify-code", { code });
}

export async function verifyTelegramClientPassword(password: string): Promise<TelegramClientSettings> {
  return api.post<TelegramClientSettings>("/settings/telegram-client/verify-password", { password });
}

export async function disconnectTelegramClient(): Promise<TelegramClientSettings> {
  return api.post<TelegramClientSettings>("/settings/telegram-client/disconnect", {});
}

export async function getTelegramClientLogs(limit = 20): Promise<TelegramClientLog[]> {
  return api.get<TelegramClientLog[]>(`/settings/telegram-client/logs?limit=${limit}`);
}

export type MessageTemplatesResponse = Record<string, string>;

export async function getMessageTemplates(): Promise<MessageTemplatesResponse> {
  return api.get<MessageTemplatesResponse>("/settings/templates");
}

export async function updateMessageTemplates(
  templates: Record<string, string>
): Promise<MessageTemplatesResponse> {
  return api.put<MessageTemplatesResponse>("/settings/templates", templates);
}
