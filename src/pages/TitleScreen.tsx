import { createPortal } from 'react-dom';
import { games } from '../data/games';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArcadeFrame, Header, Footer, PixelMark, PixelButton } from '../components/ArcadeUI';
export default function TitleScreen({ onStart }: { onStart: () => void }) {
  const [starting, setStarting] = useState(false);
  const timers = useRef<number[]>([]);
  const startingRef = useRef(false);
  const start = useCallback(() => {
    if (startingRef.current) return;
    startingRef.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onStart(); return; }
    setStarting(true);
    document.querySelector('.title-frame')?.classList.add('title-glitch');
    timers.current.push(window.setTimeout(() => document.querySelector('.title-frame')?.classList.add('title-crt-off'), 420));
    timers.current.push(window.setTimeout(onStart, 900));
  }, [onStart]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space') && !(e.target instanceof HTMLElement && e.target.closest('button'))) { e.preventDefault(); start(); }
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); timers.current.forEach(window.clearTimeout); };
  }, [start]);
  return <ArcadeFrame title><Header/><main className="title-content"><div className="eyebrow"><span className="tiny-cross">+</span> A LITTLE ESCAPE. A LOT OF PLAY.</div><div className="title-lockup"><h1>Insert<span>Coin</span><span className="title-period">.</span></h1><span className={`intro-coin ${starting ? 'coin-jump' : ''}`}><PixelMark/></span></div><p className="personal-arcade">PERSONAL ARCADE</p><div className="start-block"><PixelButton className="start-button" disabled={starting} onClick={start}><span className="start-arrow" aria-hidden="true">▶</span> {starting ? 'INSERTING…' : 'PRESS START'}</PixelButton><p>HIT ENTER <span>OR</span> CLICK TO PLAY</p></div><div className="title-bottom"><p>Small games.<br/>Big replay energy.</p><span className="ready"><i className="status-dot"/> SYSTEM READY <span className="muted">/ {String(games.length).padStart(3, '0')} GAMES LOADED</span></span></div></main><Footer/>{starting && createPortal(<div className="crt-transition" aria-hidden="true"><span className="crt-rollbar"/><span className="crt-line"/></div>, document.body)}</ArcadeFrame>;
}
