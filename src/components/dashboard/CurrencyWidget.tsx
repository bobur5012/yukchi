"use client";

import { useEffect, useState, useCallback } from "react";
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

function RateRow({
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
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
      <span className="text-[13px] font-medium flex items-center gap-1.5">
        <span className="text-base">{FLAGS[from] || ""}</span>
        <span>{from}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-base">{FLAGS[to] || ""}</span>
        <span>{to}</span>
      </span>
      {loading ? (
        <div className="h-5 w-20 rounded bg-muted/60 animate-pulse" />
      ) : (
        <span className="text-[14px] font-semibold tabular-nums text-emerald-400">
          {value}
        </span>
      )}
    </div>
  );
}

export function CurrencyWidget() {
  const { locale } = useTranslations();
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCBURates()
      .then(setRates)
      .catch(() => setError("Ошибка загрузки"))
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
        className="rounded-2xl bg-card border border-border/30 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="size-[18px] text-emerald-500" />
            </div>
            <h3 className="text-[15px] font-semibold">Курсы валют</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground py-4">{error}</p>
        <button
          type="button"
          onClick={load}
          className="text-sm text-primary hover:underline"
        >
          Повторить
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-card border border-border/30 overflow-hidden"
    >
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <TrendingUp className="size-[18px] text-emerald-500" />
          </div>
          <h3 className="text-[15px] font-semibold">Курсы валют</h3>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={cn(
            "size-8 rounded-lg flex items-center justify-center transition-colors",
            "hover:bg-accent text-muted-foreground hover:text-foreground",
            loading && "opacity-50"
          )}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-xl bg-muted/20 border border-border/20 divide-y divide-border/20 overflow-hidden">
          <RateRow
            pair="USD → UZS"
            value={rates ? rates.usdUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) : "—"}
            loading={loading}
          />
          <RateRow
            pair="USD → TRY"
            value={rates ? rates.usdTry.toFixed(2) : "—"}
            loading={loading}
          />
          <RateRow
            pair="TRY → UZS"
            value={rates ? rates.tryUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) : "—"}
            loading={loading}
          />
          <RateRow
            pair="TRY → USD"
            value={rates ? rates.tryUsd.toFixed(4) : "—"}
            loading={loading}
          />
        </div>
        {formattedDate && (
          <p className="text-[11px] text-muted-foreground mt-2 pt-2">
            CBU, {formattedDate}
          </p>
        )}
      </div>
    </motion.div>
  );
}
