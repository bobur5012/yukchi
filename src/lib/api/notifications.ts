import { api } from "./client";

export interface NotificationLogEntry {
  id: string;
  shopId?: string | null;
  channel: "bot" | "client";
  message: string;
  status: "pending" | "sent" | "failed" | "retrying";
  attempts: number;
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  shop?: { id: string; name: string; phone: string } | null;
}

export interface NotificationLogListResponse {
  items: NotificationLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function getNotificationLogs(params?: {
  page?: number;
  limit?: number;
  channel?: "bot" | "client";
}): Promise<NotificationLogListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.channel) search.set("channel", params.channel);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return api.get<NotificationLogListResponse>(`/notifications/logs${suffix}`);
}

export async function sendBotTestMessage(message: string): Promise<void> {
  return api.post<void>("/notifications/bot/send", { message });
}
