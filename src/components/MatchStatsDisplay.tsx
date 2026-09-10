import { getMatchStats } from '../utils/matchStats';
export default function MatchStatsDisplay({ gameId }: { gameId: string }) {
  const stats = getMatchStats(gameId);
  return <span className="match-stats" aria-label={`${stats.wins} wins, ${stats.losses} losses, best goal differential ${stats.bestDifferential}`}>
    <span><b>{stats.wins}</b> W / <b>{stats.losses}</b> L</span>
    <span>BEST {stats.bestDifferential > 0 ? '+' : ''}{stats.bestDifferential}</span>
  </span>;
}
