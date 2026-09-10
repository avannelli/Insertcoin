import type { ArcadeGame } from '../data/games';
import { PixelButton, ScoreDisplay } from './ArcadeUI';
import { getHighScore } from '../utils/scores';
import MatchStatsDisplay from './MatchStatsDisplay';
import RaceStatsDisplay from './RaceStatsDisplay';
export default function GameCard({ game, onPlay }: { game: ArcadeGame; onPlay: () => void }) {
  return <article className="game-card"><div className="cabinet-art" aria-hidden="true">{game.Preview ? <game.Preview/> : <span className="art-caption">{game.title}</span>}</div><div className="game-details"><div className="eyebrow">{game.genre} <span className="available">● AVAILABLE</span></div><h2>{game.title}</h2><p className="subtitle">{game.subtitle}</p><p className="description">{game.description}</p><p className="control-copy">{game.controls}</p><div className="card-bottom"><PixelButton className="primary" onClick={onPlay}>PLAY GAME <span>↗</span></PixelButton>{game.mode === 'race' ? <RaceStatsDisplay gameId={game.id}/> : game.mode === 'match' ? <MatchStatsDisplay gameId={game.id}/> : <ScoreDisplay score={getHighScore(game.id)}/>}</div></div></article>;
}


