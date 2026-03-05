export interface CBURate {
  id: number;
  Code: string;
  Ccy: string;
  CcyNm_RU: string;
  Rate: string;
  Nominal: string;
  Date: string;
}

export interface CurrencyRates {
  usdUzs: number;
  usdTry: number;
  tryUzs: number;
  tryUsd: number;
  date: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
let cache: { data: CurrencyRates; ts: number } | null = null;
let inFlight: Promise<CurrencyRates> | null = null;

function parseRates(data: CBURate[]): CurrencyRates {
  const usd = data.find((r) => r.Ccy === "USD");
  const try_ = data.find((r) => r.Ccy === "TRY");
  const usdUzs = usd ? parseFloat(usd.Rate) / parseFloat(usd.Nominal || "1") : 0;
  const tryUzs = try_ ? parseFloat(try_.Rate) / parseFloat(try_.Nominal || "1") : 0;
  const tryUsd = usdUzs > 0 && tryUzs > 0 ? tryUzs / usdUzs : 0;
  const usdTry = tryUsd > 0 ? 1 / tryUsd : 0;
  return {
    usdUzs,
    usdTry,
    tryUzs,
    tryUsd,
    date: usd?.Date || "",
  };
}

export async function fetchCBURates(): Promise<CurrencyRates> {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) return cache.data;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch("/api/cbu-proxy");
      if (!res.ok) throw new Error("Failed to fetch CBU rates");
      const data: CBURate[] = await res.json();
      const rates = parseRates(data);
      cache = { data: rates, ts: Date.now() };
      return rates;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
