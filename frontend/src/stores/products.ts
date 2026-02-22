import { create } from "zustand";
import type { Product } from "@/types";

interface ProductsState {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  getProductsByTripId: (tripId: string) => Product[];
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],

  addProduct: (product) => {
    set((state) => ({
      products: [
        ...state.products,
        {
          ...product,
          id: `p${Date.now()}`,
        },
      ],
    }));
  },

  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  getProductsByTripId: (tripId) =>
    get().products.filter((p) => p.tripId === tripId),
}));
