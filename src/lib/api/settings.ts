import { api } from "./client";

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
