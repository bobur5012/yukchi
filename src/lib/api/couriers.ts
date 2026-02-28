import { api } from "./client";
import type { Courier } from "@/types";

export async function getCouriers(
  includeInactive?: boolean
): Promise<Courier[]> {
  const q = includeInactive ? "?includeInactive=true" : "";
  return api.get<Courier[]>(`/couriers${q}`);
}

export async function getCourier(id: string): Promise<Courier> {
  return api.get<Courier>(`/couriers/${id}`);
}

export async function createCourier(data: {
  name: string;
  phone: string;
  password: string;
  avatarUrl?: string;
}): Promise<Courier> {
  return api.post<Courier>("/couriers", data);
}

export async function updateCourier(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    status: "active" | "inactive";
    avatarUrl: string;
  }>
): Promise<Courier> {
  return api.patch<Courier>(`/couriers/${id}`, data);
}

export async function deleteCourier(id: string): Promise<void> {
  await api.delete<void>(`/couriers/${id}`);
}

export async function updateCourierPoints(
  id: string,
  delta: number
): Promise<Courier> {
  return api.patch<Courier>(`/couriers/${id}/points`, { delta });
}
