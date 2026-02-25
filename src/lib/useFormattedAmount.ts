"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCBURates, type CurrencyRates } from "@/lib/api/cbu-rates";
import { useCurrencyStore, type ProfileCurrency } from "@/stores/currency";

let ratesCache: CurrencyRates | null = null;
let ratesCacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;

async function getRates(): Promise<CurrencyRates> {
  if (ratesCache && Date.now() - ratesCacheTime < CACHE_MS) {
    return ratesCache;
  }
  ratesCache = await fetchCBURates();
  ratesCacheTime = Date.now();
  return ratesCache;
}

function convertUsdToCurrency(
  amountUsd: number,
  target: ProfileCurrency,
  rates: CurrencyRates
): { value: number; formatted: string } {
  let value: number;
  switch (target) {
    case "USD":
      value = amountUsd;
      return {
        value,
        formatted: value.toLocaleString("ru-RU", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " USD",
      };
    case "UZS":
      value = amountUsd * rates.usdUzs;
      return {
        value,
        formatted: value.toLocaleString("ru-RU", {
          maximumFractionDigits: 0,
        }) + " UZS",
      };
    case "TRY":
      value = amountUsd * rates.usdTry;
      return {
        value,
        formatted: value.toLocaleString("ru-RU", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " TRY",
      };
    default:
      value = amountUsd;
      return {
        value,
        formatted: value.toLocaleString("ru-RU", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " USD",
      };
  }
}

function convertUzsToCurrency(
  amountUzs: number,
  target: ProfileCurrency,
  rates: CurrencyRates
): string {
  const amountUsd = rates.usdUzs > 0 ? amountUzs / rates.usdUzs : 0;
  return convertUsdToCurrency(amountUsd, target, rates).formatted;
}

export function useFormattedAmount() {
  const profileCurrency = useCurrencyStore((s) => s.currency);
  const [rates, setRates] = useState<CurrencyRates | null>(null);

  useEffect(() => {
    getRates()
      .then(setRates)
      .catch(() => setRates(null));
  }, []);

  const formatAmount = useCallback(
    (amountUsd: number): string => {
      if (!rates) {
        return (
          amountUsd.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + " USD"
        );
      }
      return convertUsdToCurrency(amountUsd, profileCurrency, rates).formatted;
    },
    [profileCurrency, rates]
  );

  const formatAmountFromUzs = useCallback(
    (amountUzs: number): string => {
      if (!rates) {
        return (
          amountUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " UZS"
        );
      }
      return convertUzsToCurrency(amountUzs, profileCurrency, rates);
    },
    [profileCurrency, rates]
  );

  return { formatAmount, formatAmountFromUzs, rates, profileCurrency };
}
