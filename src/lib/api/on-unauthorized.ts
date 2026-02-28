/**
 * Callback when API returns 401.
 * Set by ApiTokenProvider to avoid circular dependency.
 *
 * The `handling` flag prevents the infinite loop:
 *   401 → logout() → apiLogout() → 401 → logout() → ...
 */
let onUnauthorized: (() => void) | null = null;
let handling = false;

export function setOnUnauthorized(fn: () => void): void {
  onUnauthorized = fn;
  handling = false;
}

export function handleUnauthorized(): void {
  if (handling || !onUnauthorized) return;
  handling = true;
  try {
    onUnauthorized();
  } finally {
    setTimeout(() => {
      handling = false;
    }, 5000);
  }
}
