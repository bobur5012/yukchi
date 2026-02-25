"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, RefreshCw, TrendingUp } from "lucide-react";
import { fetchCBURates, type CurrencyRates } from "@/lib/api/cbu-rates";
import { cn } from "@/lib/utils";

function RateRow({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {loading ? (
        <div className="h-5 w-16 rounded bg-muted/60 animate-pulse" />
      ) : (
        <span className="text-[15px] font-semibold tabular-nums">{value}</span>
      )}
    </div>
  );
}

export function CurrencyWidget() {
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchCBURates()
      .then(setRates)
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border/30 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="size-5 text-primary" />
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

      <div className="px-4 pb-4 space-y-0">
        <RateRow
          label="1 USD → UZS"
          value={rates ? rates.usdUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) : "—"}
          loading={loading}
        />
        <RateRow
          label="1 TRY → UZS"
          value={rates ? rates.tryUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) : "—"}
          loading={loading}
        />
        <RateRow
          label="1 TRY → USD"
          value={rates ? rates.tryUsd.toFixed(4) : "—"}
          loading={loading}
        />
        {rates?.date && (
          <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/30">
            CBU, {rates.date}
          </p>
        )}
      </div>
    </motion.div>
  );
}
