import type { ArcadeGame } from '../data/games';
import { ArcadeFrame, Header, Footer } from '../components/ArcadeUI';
import GameShell from '../components/GameShell';
export default function GameView({ game, onBack }: { game: ArcadeGame; onBack: () => void }) { return <ArcadeFrame><Header><span className="wordmark">InsertCoin.</span></Header><main className="game-content"><button className="back-button" onClick={onBack}>← BACK TO ARCADE</button><div className="game-page-heading"><h1>{game.title}</h1><span className="eyebrow">{game.genre}</span></div><GameShell game={game} onBack={onBack}/><section className="instructions-card" aria-labelledby="instructions-title"><h2 id="instructions-title">HOW TO PLAY</h2><div className="instruction-columns"><div><h3>CONTROLS</h3><p>{game.controls}</p></div><div><h3>THE GOAL</h3><p>{game.objective}</p></div></div></section></main><Footer/></ArcadeFrame>; }


