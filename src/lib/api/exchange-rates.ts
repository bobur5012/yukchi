import { api } from "./client";
import type { ExchangeRate } from "@/types";

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  return api.get<ExchangeRate[]>("/exchange-rates");
}
