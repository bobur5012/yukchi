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
