import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, logout as apiLogout } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: AuthUser, token: string) => void;
  initFromStorage: () => void;
}

const AUTH_KEY = "yukchi_auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const res = await apiLogin(phone, password);
          if (typeof window !== "undefined") {
            localStorage.setItem("yukchi_token", res.accessToken);
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
        }
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("yukchi_token", token);
        }
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        });
      },

      initFromStorage: () => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("yukchi_token");
        const stored = localStorage.getItem(AUTH_KEY);
        if (token && stored) {
          try {
            const { state } = JSON.parse(stored);
            if (state?.user) {
              set({
                user: state.user,
                accessToken: token,
                isAuthenticated: true,
              });
            }
          } catch {
            // ignore
          }
        }
      },
    }),
    {
      name: AUTH_KEY,
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
