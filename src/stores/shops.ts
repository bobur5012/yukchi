import { create } from "zustand";
import type { Shop, ShopDebtEntry } from "@/types";

interface ShopsState {
  shops: Shop[];
  addShop: (shop: Omit<Shop, "id">) => void;
  addDebtEntry: (shopId: string, entry: Omit<ShopDebtEntry, "id" | "shopId" | "createdAt">) => void;
  updateShop: (id: string, updates: Partial<Shop>) => void;
  getShopById: (id: string) => Shop | undefined;
}

export const useShopsStore = create<ShopsState>((set, get) => ({
  shops: [],

  addShop: (shop) =>
    set((state) => ({
      shops: [
        ...state.shops,
        {
          ...shop,
          id: `s${Date.now()}`,
        },
      ],
    })),

  addDebtEntry: (shopId, entry) =>
    set((state) => ({
      shops: state.shops.map((s) => {
        if (s.id !== shopId) return s;
        const newEntry: ShopDebtEntry = {
          ...entry,
          id: `e${Date.now()}`,
          shopId,
          createdAt: new Date().toISOString(),
        };
        const debtEntries = [...(s.debtEntries ?? []), newEntry];
        const amount = parseFloat(entry.amount || "0");
        const currentDebt = parseFloat(s.debt || "0");
        const newDebt = entry.type === "payment"
          ? Math.max(0, currentDebt - amount)
          : currentDebt + amount;
        return {
          ...s,
          debtEntries,
          debt: String(newDebt.toFixed(2)),
        };
      }),
    })),

  updateShop: (id, updates) =>
    set((state) => ({
      shops: state.shops.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  getShopById: (id) => get().shops.find((s) => s.id === id),
}));
