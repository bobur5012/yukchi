/**
 * Callback when API returns 401.
 * Set by ApiTokenProvider to avoid circular dependency.
 */
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(fn: () => void): void {
  onUnauthorized = fn;
}

export function handleUnauthorized(): void {
  if (onUnauthorized) onUnauthorized();
}
