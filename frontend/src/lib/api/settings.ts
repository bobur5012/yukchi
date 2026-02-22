import { api } from "./client";

export interface TelegramSettings {
  token: string;
  chatId: string;
  status: "connected" | "disconnected" | "error";
}

export async function getTelegramSettings(): Promise<TelegramSettings> {
  return api.get<TelegramSettings>("/settings/telegram");
}

export async function updateTelegramSettings(
  data: Partial<TelegramSettings>
): Promise<TelegramSettings> {
  return api.put<TelegramSettings>("/settings/telegram", data);
}
