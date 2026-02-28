import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, logout as apiLogout } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: AuthUser, token: string) => void;
  setHasHydrated: (value: boolean) => void;
}

const AUTH_KEY = "yukchi_auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const res = await apiLogin(phone, password);
          if (typeof document !== "undefined") {
            document.cookie = `yukchi_token=${res.accessToken}; path=/; SameSite=Lax; max-age=86400`;
          }
          set({
            user: res.user,
            accessToken: res.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
          const e = new Error("Invalid credentials");
          (e as Error & { code?: string }).code = "INVALID_CREDENTIALS";
          throw e;
        }
      },

      logout: async () => {
        try {
          await apiLogout();
        } catch {
          // ignore
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("yukchi_token");
          document.cookie = "yukchi_token=; path=/; max-age=0";
        }
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      setAuth: (user, token) => {
        if (typeof document !== "undefined") {
          document.cookie = `yukchi_token=${token}; path=/; SameSite=Lax; max-age=86400`;
        }
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        });
      },

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: AUTH_KEY,
      version: 1,
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (typeof window !== "undefined") {
          if (error) {
            console.warn("[auth] rehydration error, clearing storage", error);
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem("yukchi_token");
            document.cookie = "yukchi_token=; path=/; max-age=0";
          } else if (state?.accessToken) {
            localStorage.setItem("yukchi_token", state.accessToken);
            document.cookie = `yukchi_token=${state.accessToken}; path=/; SameSite=Lax; max-age=86400`;
          }
          useAuthStore.getState().setHasHydrated(true);
        }
      },
    }
  )
);
