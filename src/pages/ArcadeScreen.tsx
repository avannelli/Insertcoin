import { ArcadeFrame, Header, Footer } from '../components/ArcadeUI';
import GameCard from '../components/GameCard';
import { games, type ArcadeGame } from '../data/games';
export default function ArcadeScreen({ onPlay, onHome }: { onPlay: (game: ArcadeGame) => void; onHome: () => void }) {
  return <ArcadeFrame menu>
    <Header><button className="wordmark" onClick={onHome} aria-label="InsertCoin home">INSERTCOIN<i>.</i></button></Header>
    <main className="arcade-content">
      <div className="section-heading"><div className="menu-brand"><p className="eyebrow">ARCADE FLOOR / ALL SYSTEMS ONLINE</p><h1 aria-label="Choose your game">CHOOSE YOUR <span>GAME</span><i>.</i></h1></div></div>
      <div className="section-meta"><span>SELECT A CABINET TO BEGIN</span><span>0{games.length} MACHINES / ∞ RETRIES</span></div>
      <div className="game-grid">{games.map((game, index) => <GameCard key={game.id} game={game} index={index} onPlay={() => onPlay(game)}/>)}</div>
      <p className="selection-note"><span>NO COINS REQUIRED.</span> PICK A MACHINE. CHASE THE HIGH SCORE.</p>
    </main><Footer/>
  </ArcadeFrame>;
}
