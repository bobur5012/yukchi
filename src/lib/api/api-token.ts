/**
 * Centralized token access for API client.
 * Avoids circular dependency: auth store -> api -> auth store.
 * The getter is set by ApiTokenProvider on app mount to read from auth store.
 */
let tokenGetter: (() => string | null) | null = null;

export function setApiTokenGetter(fn: () => string | null): void {
  tokenGetter = fn;
}

export function getApiToken(): string | null {
  if (tokenGetter) return tokenGetter();
  if (typeof window === "undefined") return null;
  return localStorage.getItem("yukchi_token");
}
