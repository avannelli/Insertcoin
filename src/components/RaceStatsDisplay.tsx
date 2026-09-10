import { getRaceStats, ordinal, raceTime } from '../utils/raceStats';
export default function RaceStatsDisplay({ gameId }: { gameId: string }) {
  const stats = getRaceStats(gameId);
  return <span className="match-stats"><span>BEST <b>{stats.bestPosition ? ordinal(stats.bestPosition) : '—'}</b></span><span>{stats.bestTime ? raceTime(stats.bestTime) : 'NO FINISH YET'}</span><span>{stats.wins} WINS</span></span>;
}
