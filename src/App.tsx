import { useCallback, useEffect, useRef, useState } from 'react';
import TitleScreen from './pages/TitleScreen';
import ArcadeScreen from './pages/ArcadeScreen';
import GameView from './pages/GameView';
import { ScreenTransition } from './components/ArcadeUI';
import type { ArcadeGame } from './data/games';
import { sound } from './utils/sound';
export default function App() {
  const [screen, setScreen] = useState<'title' | 'arcade' | 'game'>('title');
  const [game, setGame] = useState<ArcadeGame>();
  const initial = useRef(true);
  const start = useCallback(() => { sound.play('start'); setScreen('arcade'); }, []);
  useEffect(() => { if (initial.current) { initial.current = false; return; } window.scrollTo(0, 0); const heading = document.querySelector('h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }); }, [screen]);
  return <ScreenTransition key={screen}>{screen === 'title' ? <TitleScreen onStart={start}/> : screen === 'arcade' ? <ArcadeScreen onHome={() => setScreen('title')} onPlay={g => { sound.play('select'); setGame(g); setScreen('game'); }}/> : game && <GameView game={game} onBack={() => setScreen('arcade')}/>}</ScreenTransition>;
}
