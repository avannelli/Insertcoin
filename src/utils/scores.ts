export function getHighScore(gameId: string): number {
  try { const n = Number(localStorage.getItem(`insertcoin:high:${gameId}`)); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; } catch { return 0; }
}
export function saveHighScore(gameId: string, score: number): number {
  const high = Math.max(getHighScore(gameId), Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0);
  try { localStorage.setItem(`insertcoin:high:${gameId}`, String(high)); } catch { /* Storage may be unavailable in private browsing. */ }
  return high;
}
export const formatScore = (n: number) => String(n).padStart(6, '0');
