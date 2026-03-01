import { getApiToken } from "./api-token";
import { handleUnauthorized } from "./on-unauthorized";
import { clearCached, getCacheKey, getCached, setCached } from "@/lib/cache/api-cache";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "" : "http://localhost:3000") + "/api/v1";

let refreshInFlight: Promise<string | null> | null = null;

function shouldBypassCache(path: string): boolean {
  return (
    path.startsWith("/dashboard") ||
    path.startsWith("/trips") ||
    path.startsWith("/products")
  );
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const token =
      (json &&
        typeof json === "object" &&
        "data" in json &&
        (json as { data?: { accessToken?: string } }).data?.accessToken) ||
      (json as { accessToken?: string } | null)?.accessToken ||
      null;

    if (!token || typeof window === "undefined") return token;

    localStorage.setItem("yukchi_token", token);
    document.cookie = `yukchi_token=${token}; path=/; SameSite=Lax; max-age=86400`;

    const { useAuthStore } = await import("@/stores/auth");
    useAuthStore.getState().setAccessToken(token);
    return token;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  hasRetried = false
): Promise<T> {
  const token = getApiToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (res.status === 401) {
    if (!hasRetried && !path.startsWith("/auth/")) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return apiFetch<T>(path, options, true);
      }
    }

    if (typeof window !== "undefined") {
      handleUnauthorized();
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json && typeof json === "object" && "data" in json)
    ? json.data
    : json;
}

async function cachedGet<T>(path: string): Promise<T> {
  if (shouldBypassCache(path)) {
    return apiFetch<T>(path, { method: "GET" });
  }

  const key = getCacheKey(path);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const cached = await getCached<T>(key);
    if (cached !== null) return cached;
    throw new Error("Нет соединения. Данные недоступны офлайн.");
  }
  const data = await apiFetch<T>(path, { method: "GET" });
  await setCached(key, data);
  return data;
}

async function mutateWithOfflineQueue<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const { useSyncQueue } = await import("@/stores/sync-queue");
    await useSyncQueue.getState().enqueue({ method, path, body });
    throw new Error("Действие сохранено. Будет выполнено при подключении к интернету.");
  }
  const result = await apiFetch<T>(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  await clearCached();
  return result;
}

export const api = {
  get: <T>(path: string) => cachedGet<T>(path),
  post: <T>(path: string, body?: unknown) =>
    mutateWithOfflineQueue<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    mutateWithOfflineQueue<T>("PATCH", path, body),
  delete: <T>(path: string, body?: unknown) =>
    mutateWithOfflineQueue<T>("DELETE", path, body),
};
