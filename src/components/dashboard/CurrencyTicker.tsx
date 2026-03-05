"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fetchCBURates, type CurrencyRates } from "@/lib/api/cbu-rates";
import { cn } from "@/lib/utils";

const FLAG_MAP: Record<string, string> = {
  USD: "🇺🇸",
  UZS: "🇺🇿",
  TRY: "🇹🇷",
};

export function CurrencyTicker({
  className,
}: {
  className?: string;
}) {
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchCBURates()
      .then((data) => {
        if (active) setRates(data);
      })
      .catch(() => {
        if (active) setRates(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => {
    if (!rates) {
      return [
        { pair: "USD → UZS", value: "..." },
        { pair: "USD → TRY", value: "..." },
        { pair: "TRY → UZS", value: "..." },
        { pair: "TRY → USD", value: "..." },
      ];
    }

    return [
      {
        pair: "USD → UZS",
        value: rates.usdUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }),
      },
      {
        pair: "USD → TRY",
        value: rates.usdTry.toFixed(2),
      },
      {
        pair: "TRY → UZS",
        value: rates.tryUzs.toLocaleString("ru-RU", { maximumFractionDigits: 0 }),
      },
      {
        pair: "TRY → USD",
        value: rates.tryUsd.toFixed(4),
      },
    ];
  }, [rates]);

  const repeatedItems = [...items, ...items];

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border-b border-white/5 bg-[linear-gradient(180deg,rgba(25,25,31,0.92)_0%,rgba(16,16,21,0.74)_100%)] backdrop-blur supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(25,25,31,0.78)_0%,rgba(16,16,21,0.58)_100%)]",
        className
      )}
    >
      <div className="relative overflow-hidden py-1.5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-card via-card/85 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-card via-card/85 to-transparent" />
        <div className={cn("courier-ticker-track", loading && "opacity-80")}>
          {repeatedItems.map((item, index) => {
            const [from, to] = item.pair.split(" → ");
            return (
              <div
                key={`${item.pair}-${index}`}
                className="flex items-center gap-2 rounded-full border border-white/8 bg-background/45 px-2.5 py-1 text-[12px] shadow-sm shadow-black/10"
              >
                <span className="whitespace-nowrap text-muted-foreground">
                  {FLAG_MAP[from] ?? from} → {FLAG_MAP[to] ?? to}
                </span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-emerald-400">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
