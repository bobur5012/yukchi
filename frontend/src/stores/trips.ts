import { create } from "zustand";
import type { Trip, Expense } from "@/types";

interface TripsState {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, "id" | "expenses" | "products">) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  addExpense: (tripId: string, expense: Omit<Expense, "id">) => void;
  getTripById: (id: string) => Trip | undefined;
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],

  addTrip: (trip) =>
    set((state) => ({
      trips: [
        ...state.trips,
        {
          ...trip,
          id: `t${Date.now()}`,
          expenses: [],
          products: [],
        },
      ],
    })),

  updateTrip: (id, updates) =>
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  addExpense: (tripId, expense) =>
    set((state) => ({
      trips: state.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              expenses: [
                ...(t.expenses ?? []),
                { ...expense, id: `e${Date.now()}` },
              ],
            }
          : t
      ),
    })),

  getTripById: (id) => get().trips.find((t) => t.id === id),
}));
