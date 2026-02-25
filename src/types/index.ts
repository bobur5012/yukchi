// Aligned with backend Prisma schema

export type UserRole = "admin" | "courier";

export type CourierStatus = "active" | "inactive";

export type TripStatus = "planned" | "active" | "completed" | "cancelled";

export type ShopStatus = "active" | "inactive";

export interface Region {
  id: string;
  name: string;
  nameUz: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  status: CourierStatus;
}

export interface TripCourier {
  id: string;
  tripId: string;
  courierId: string;
  courier?: Courier;
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: string;
  amountUsd: string;
  currency: string;
  createdAt: string;
}

export interface Product {
  id: string;
  tripId: string;
  name: string;
  quantity: number;
  unit?: string;
  costPrice: string;
  costPriceUsd: string;
  salePrice?: string;
  salePriceUsd?: string;
  pricePerKg?: string;
  pricePerKgUsd?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface Trip {
  id: string;
  name: string;
  departureDate: string;
  returnDate: string;
  budget: string;
  oldDebt: string;
  currency: string;
  exchangeRate: string;
  budgetUsd: string;
  status: TripStatus;
  regionId: string;
  region?: Region;
  tripCouriers?: TripCourier[];
  products?: Product[];
  expenses?: Expense[];
}

export interface ShopDebtEntry {
  id: string;
  shopId: string;
  amount: string;
  description?: string;
  type: "debt" | "payment";
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address?: string;
  debt: string;
  status: ShopStatus;
  debtEntries?: ShopDebtEntry[];
}

export interface Payment {
  id: string;
  amount: string;
  date: string;
  comment?: string;
}

export interface ExchangeRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: string;
}
