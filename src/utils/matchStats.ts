import { readLocalStats, writeLocalStats } from './localStats';
export interface MatchStats { wins: number; losses: number; bestDifferential: number; }
const empty = (): MatchStats => ({ wins: 0, losses: 0, bestDifferential: 0 });
export function getMatchStats(gameId: string): MatchStats {
  return readLocalStats(`insertcoin:matches:${gameId}`, (value): value is MatchStats => {
    if (!value || typeof value !== 'object') return false;
    const v = value as MatchStats;
    return Number.isSafeInteger(v.wins) && v.wins >= 0 && Number.isSafeInteger(v.losses) && v.losses >= 0 && Number.isSafeInteger(v.bestDifferential);
  }, empty);
}
export function saveMatchResult(gameId: string, player: number, opponent: number): MatchStats {
  const stats = getMatchStats(gameId);
  if (![player, opponent].every(n => Number.isSafeInteger(n) && n >= 0) || player === opponent) return stats;
  const played = stats.wins + stats.losses > 0;
  const next = {
    wins: stats.wins + Number(player > opponent), losses: stats.losses + Number(player < opponent),
    bestDifferential: played ? Math.max(stats.bestDifferential, player - opponent) : player - opponent,
  };
  return writeLocalStats(`insertcoin:matches:${gameId}`, next);
}
