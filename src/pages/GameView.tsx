import { useEffect } from 'react';
import type { ArcadeGame } from '../data/games';
import { ArcadeFrame, Footer } from '../components/ArcadeUI';
import GameShell from '../components/GameShell';
export default function GameView({ game, onBack }: { game: ArcadeGame; onBack: () => void }) {
  const circuit = game.id === 'circuit-break';
  useEffect(() => { window.scrollTo(0, 0); }, [game]);
  return <ArcadeFrame play>
    <main className={`game-content ${circuit ? 'circuit-content' : game.id === 'silly-fish' ? 'fish-content' : game.id === 'air-hockey' ? 'hockey-content' : ''}`}>
      <h1 className="sr-only">{game.title}</h1>
      <GameShell game={game} onBack={onBack}/>
      <section className="instructions-card" aria-labelledby="instructions-title"><h2 id="instructions-title">HOW TO PLAY</h2><div className="instruction-columns"><div><h3>CONTROLS</h3><p>{circuit ? 'Phone: slide the control below the board to move the paddle, then tap Launch ball. Computer: move your mouse or use ← → / A D. Space launches; P pauses. Keep your finger below the board so the ball and paddle stay visible.' : game.controls}</p></div><div><h3>THE GOAL</h3><p>{game.objective}</p></div></div></section>
    </main><Footer/>
  </ArcadeFrame>;
}