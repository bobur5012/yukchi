import { api } from "./client";
import type { Trip, Expense } from "@/types";

export interface TripsResponse {
  trips: Trip[];
  total: number;
  page: number;
  limit: number;
}

export async function getTrips(
  page = 1,
  limit = 20
): Promise<TripsResponse> {
  return api.get<TripsResponse>(`/trips?page=${page}&limit=${limit}`);
}

export async function getTrip(id: string): Promise<Trip> {
  return api.get<Trip>(`/trips/${id}`);
}

export async function createTrip(data: {
  name: string;
  departureDate: string;
  returnDate: string;
  budget: string;
  oldDebt?: string;
  currency: string;
  regionId: string;
  courierIds?: string[];
}): Promise<Trip> {
  return api.post<Trip>("/trips", data);
}

export async function updateTrip(
  id: string,
  data: Partial<{
    name: string;
    departureDate: string;
    returnDate: string;
    budget: string;
    oldDebt: string;
    currency: string;
    regionId: string;
    status: string;
    courierIds: string[];
  }>
): Promise<Trip> {
  return api.patch<Trip>(`/trips/${id}`, data);
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete<void>(`/trips/${id}`);
}

export async function addExpense(
  tripId: string,
  data: { description: string; amount: string; currency: string }
): Promise<Expense> {
  return api.post<Expense>("/expenses", {
    tripId,
    description: data.description,
    amount: data.amount,
    currency: data.currency,
  });
}
