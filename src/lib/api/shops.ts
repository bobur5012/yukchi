import { api } from "./client";
import type { Shop } from "@/types";

export interface ShopsResponse {
  shops: Shop[];
  total: number;
  page: number;
  limit: number;
}

export async function getShops(
  page = 1,
  limit = 20
): Promise<ShopsResponse> {
  return api.get<ShopsResponse>(`/shops?page=${page}&limit=${limit}`);
}

export async function getShop(id: string): Promise<Shop> {
  return api.get<Shop>(`/shops/${id}`);
}

export async function createShop(data: {
  name: string;
  ownerName: string;
  phone: string;
  address?: string;
  region?: string;
}): Promise<Shop> {
  return api.post<Shop>("/shops", data);
}

export async function updateShop(
  id: string,
  data: Partial<{
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    region: string;
    status: "active" | "inactive";
  }>
): Promise<Shop> {
  return api.patch<Shop>(`/shops/${id}`, data);
}

export async function deleteShop(id: string): Promise<void> {
  await api.delete<void>(`/shops/${id}`);
}

export async function addDebtEntry(
  shopId: string,
  data: {
    amount: string;
    type: "debt" | "payment";
    description?: string;
  }
): Promise<{ entry: { id: string }; debt: string }> {
  return api.post<{ entry: { id: string }; debt: string }>(
    `/shops/${shopId}/debt`,
    data
  );
}

export interface ShopReminder {
  id: string;
  shopId: string;
  type: "monthly" | "one_time";
  dayOfMonth?: number;
  reminderAt?: string;
  enabled: boolean;
  lastSentAt?: string;
  createdAt: string;
}

export async function getReminders(shopId: string): Promise<ShopReminder[]> {
  return api.get<ShopReminder[]>(`/shops/${shopId}/reminders`);
}

export async function createReminder(
  shopId: string,
  data: {
    type: "monthly" | "one_time";
    dayOfMonth?: number;
    reminderAt?: string;
    enabled?: boolean;
  }
): Promise<ShopReminder> {
  return api.post<ShopReminder>(`/shops/${shopId}/reminders`, data);
}

export async function updateReminder(
  shopId: string,
  id: string,
  data: Partial<{
    type: "monthly" | "one_time";
    dayOfMonth?: number;
    reminderAt?: string;
    enabled?: boolean;
  }>
): Promise<ShopReminder> {
  return api.patch<ShopReminder>(`/shops/${shopId}/reminders/${id}`, data);
}

export async function deleteReminder(
  shopId: string,
  id: string
): Promise<void> {
  await api.delete<void>(`/shops/${shopId}/reminders/${id}`);
}
