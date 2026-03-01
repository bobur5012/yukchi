import { api } from "./client";

export interface DashboardMetrics {
  tripsCount: number;
  couriersCount: number;
  shopsCount: number;
  totalBudgetUsd: string;
  totalExpensesUsd: string;
  totalIncomeUsd?: string;
  remainingUsd: string;
  totalDebt: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  activeTrips: Array<{
    id: string;
    name: string;
    departureDate: string;
    returnDate: string;
    budget: string;
    budgetUsd: string;
    region?: { id: string; name: string };
  }>;
  recentTrips: Array<{
    id: string;
    name: string;
    departureDate: string;
    returnDate: string;
    region?: { id: string; name: string };
    _count?: { products: number; tripCouriers: number };
  }>;
}

export async function getDashboard(): Promise<DashboardData> {
  return api.get<DashboardData>("/dashboard");
}
