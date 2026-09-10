/** Shared best-effort JSON persistence for small local game statistics. */
export function readLocalStats<T>(key: string, valid: (value: unknown) => value is T, fallback: () => T): T {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null'); return valid(value) ? value : fallback(); }
  catch { return fallback(); }
}
export function writeLocalStats<T>(key: string, value: T): T {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be disabled. */ }
  return value;
}
