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
  tryUzs: number;
  tryUsd: number;
  date: string;
}

export async function fetchCBURates(): Promise<CurrencyRates> {
  const res = await fetch("/api/cbu-proxy");
  if (!res.ok) throw new Error("Failed to fetch CBU rates");
  const data: CBURate[] = await res.json();

  const usd = data.find((r) => r.Ccy === "USD");
  const try_ = data.find((r) => r.Ccy === "TRY");

  const usdUzs = usd ? parseFloat(usd.Rate) / parseFloat(usd.Nominal || "1") : 0;
  const tryUzs = try_ ? parseFloat(try_.Rate) / parseFloat(try_.Nominal || "1") : 0;
  const tryUsd = usdUzs > 0 && tryUzs > 0 ? tryUzs / usdUzs : 0;

  return {
    usdUzs,
    tryUzs,
    tryUsd,
    date: usd?.Date || "",
  };
}
