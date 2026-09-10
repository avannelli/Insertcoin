import { games } from '../data/games';
import { useEffect } from 'react';
import { ArcadeFrame, Header, Footer, PixelMark, PixelButton } from '../components/ArcadeUI';
export default function TitleScreen({ onStart }: { onStart: () => void }) {
  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.code === 'Enter' || e.code === 'Space') && !(e.target instanceof HTMLElement && e.target.closest('button'))) { e.preventDefault(); onStart(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [onStart]);
  return <ArcadeFrame title><Header/><main className="title-content"><div className="eyebrow"><span className="tiny-cross">+</span> A LITTLE ESCAPE. A LOT OF PLAY.</div><div className="title-lockup"><h1>Insert<span>Coin</span><span className="title-period">.</span></h1><PixelMark/></div><p className="personal-arcade">PERSONAL ARCADE</p><div className="start-block"><PixelButton className="start-button" onClick={onStart}><span className="start-arrow" aria-hidden="true">▶</span> PRESS START</PixelButton><p>HIT ENTER <span>OR</span> CLICK TO PLAY</p></div><div className="title-bottom"><p>Small games.<br/>Big replay energy.</p><span className="ready"><i className="status-dot"/> SYSTEM READY <span className="muted">/ {String(games.length).padStart(3, '0')} GAMES LOADED</span></span></div></main><Footer/></ArcadeFrame>;
}

