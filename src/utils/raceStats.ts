import { readLocalStats, writeLocalStats } from './localStats';
export interface RaceStats { bestTime: number | null; bestPosition: number | null; wins: number; races: number; }
const empty = (): RaceStats => ({ bestTime: null, bestPosition: null, wins: 0, races: 0 });
export function getRaceStats(id: string): RaceStats {
  return readLocalStats(`insertcoin:races:${id}`, (value): value is RaceStats => {
    if (!value || typeof value !== 'object') return false;
    const v = value as RaceStats;
    return (v.bestTime === null || Number.isFinite(v.bestTime) && v.bestTime > 0)
      && (v.bestPosition === null || Number.isInteger(v.bestPosition) && v.bestPosition >= 1 && v.bestPosition <= 8)
      && Number.isSafeInteger(v.wins) && v.wins >= 0 && Number.isSafeInteger(v.races) && v.races >= v.wins;
  }, empty);
}
export function saveRaceResult(id: string, time: number, position: number): RaceStats {
  const stats = getRaceStats(id);
  if (!Number.isFinite(time) || time <= 0 || !Number.isInteger(position) || position < 1 || position > 8) return stats;
  return writeLocalStats(`insertcoin:races:${id}`, {
    bestTime: Math.min(stats.bestTime ?? Infinity, time), bestPosition: Math.min(stats.bestPosition ?? 8, position),
    wins: stats.wins + Number(position === 1), races: stats.races + 1,
  });
}
export const raceTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
export const ordinal = (position: number) => `${position}${position === 1 ? 'ST' : position === 2 ? 'ND' : position === 3 ? 'RD' : 'TH'}`;
