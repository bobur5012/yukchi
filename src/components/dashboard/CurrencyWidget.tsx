"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw, TrendingUp } from "lucide-react";
import { fetchCBURates, type CurrencyRates } from "@/lib/api/cbu-rates";
import { parseCBUDate } from "@/lib/date-utils";
import { useTranslations } from "@/lib/useTranslations";
import { cn } from "@/lib/utils";

const FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  UZS: "🇺🇿",
  TRY: "🇹🇷",
};

function RateChip({
  pair,
  value,
  loading,
}: {
  pair: string;
  value: string;
  loading: boolean;
}) {
  const [from, to] = pair.split(" → ");
  return (
    <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-muted/20 text-[12px] shrink-0">
      <span className="text-muted-foreground">{FLAGS[from] || from}→{FLAGS[to] || to}</span>
      {loading ? (
        <div className="h-4 w-14 rounded bg-muted/60 animate-pulse" />
      ) : (
        <span className="font-semibold tabular-nums text-emerald-500">{value}</span>
      )}
    </div>
  );
}

export function CurrencyWidget() {
  const { t, locale } = useTranslations();
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tRef = useRef(t);
  tRef.current = t;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCBURates()
      .then(setRates)
      .catch(() => setError(tRef.current("common.loadError")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formattedDate = rates?.date
    ? (() => {
        const d = parseCBUDate(rates.date);
        if (!d) return rates.date;
        return new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(d);
      })()
    : "";

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border/30 p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="size-3.5 text-emerald-500" />
            </div>
            <h3 className="text-[13px] font-semibold">{t("dashboard.currencyRates")}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground py-4">{error}</p>
        <button
          type="button"
          onClick={load}
          className="text-sm text-primary hover:underline"
        >
          {t("common.retry")}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-card border border-border/30 p-3 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
            <TrendingUp className="size-3.5 text-emerald-500" />
          </div>
          <h3 className="text-[13px] font-semibold truncate">{t("dashboard.currencyRates")}</h3>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={cn(
            "size-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            "hover:bg-accent text-muted-foreground hover:text-foreground",
            loading && "opacity-50"
          )}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <RateChip
          pair="USD → UZS"
          value={rates ? rates.usdUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) : "—"}
          loading={loading}
        />
        <RateChip
          pair="USD → TRY"
          value={rates ? rates.usdTry.toFixed(2) : "—"}
          loading={loading}
        />
        <RateChip
          pair="TRY → UZS"
          value={rates ? rates.tryUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) : "—"}
          loading={loading}
        />
        <RateChip
          pair="TRY → USD"
          value={rates ? rates.tryUsd.toFixed(4) : "—"}
          loading={loading}
        />
      </div>
      {formattedDate && (
        <p className="text-[10px] text-muted-foreground mt-1.5">
          CBU, {formattedDate}
        </p>
      )}
    </motion.div>
  );
}
