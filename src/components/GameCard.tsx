import type { CSSProperties } from 'react';
import type { ArcadeGame } from '../data/games';
import { PixelButton, ScoreDisplay } from './ArcadeUI';
import { getHighScore } from '../utils/scores';
import MatchStatsDisplay from './MatchStatsDisplay';
import RaceStatsDisplay from './RaceStatsDisplay';
export default function GameCard({ game, onPlay, index = 0 }: { game: ArcadeGame; onPlay: () => void; index?: number }) {
  const number = String(index + 1).padStart(2, '0');
  return <article className="game-card" data-game={game.id} style={{ '--card-index': index } as CSSProperties}>
    <div className="machine-marquee"><span>GAME / {number}</span><span className="marquee-lights" aria-hidden="true">◆ ◆ ◆</span><span>READY</span></div>
    <div className="cabinet-art" aria-hidden="true">{game.Preview ? <game.Preview/> : <span className="art-caption">{game.title}</span>}<span className="screen-glare"/></div>
    <div className="game-details">
      <div className="eyebrow"><span className="genre-chip">{game.genre}</span><span className="available">● ONLINE</span></div>
      <h2><span className="selection-cursor" aria-hidden="true">▶</span>{game.title}</h2>
      <p className="subtitle">{game.subtitle}</p>
      <p className="description">{game.description}</p>
      <div className="card-bottom"><PixelButton className="primary" aria-label="PLAY GAME" onClick={onPlay}>INSERT COIN <span>↗</span></PixelButton>{game.mode === 'race' ? <RaceStatsDisplay gameId={game.id}/> : game.mode === 'match' ? <MatchStatsDisplay gameId={game.id}/> : <ScoreDisplay score={getHighScore(game.id)}/>}</div>
    </div>
  </article>;
}