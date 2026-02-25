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
