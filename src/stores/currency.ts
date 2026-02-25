import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProfileCurrency = "USD" | "UZS" | "TRY";

interface CurrencyState {
  currency: ProfileCurrency;
  setCurrency: (c: ProfileCurrency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "USD",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "yukchi_profile_currency" }
  )
);
