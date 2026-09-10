import { useEffect, useRef, useState } from 'react';
import type { ArcadeGame } from '../data/games';
import type { GameController, GameSnapshot } from '../games/types';
import { PixelButton, ScoreDisplay } from './ArcadeUI';
import { getHighScore } from '../utils/scores';
import MatchStatsDisplay from './MatchStatsDisplay';
import RaceStatsDisplay from './RaceStatsDisplay';
import { ordinal, raceTime } from '../utils/raceStats';

export default function GameShell({ game, onBack }: { game: ArcadeGame; onBack: () => void }) {
  const host = useRef<HTMLDivElement>(null), shell = useRef<HTMLDivElement>(null);
  const controller = useRef<GameController | null>(null);
  const lives = game.lives ?? 3;
  const [state, setState] = useState<GameSnapshot>({ score: 0, lives, status: 'ready' });
  const [loaded, setLoaded] = useState(false), [error, setError] = useState('');
  const [fullscreenError, setFullscreenError] = useState('');
  useEffect(() => {
    let disposed = false;
    game.load().then(module => {
      if (!disposed && host.current) {
        controller.current = module.mount(host.current, snapshot => {
          if (!disposed) { setState(snapshot); setLoaded(true); }
        });
        host.current.focus();
      }
    }).catch(() => { if (!disposed) setError('Could not load this game. Please refresh and try again.'); });
    return () => { disposed = true; controller.current?.destroy(); controller.current = null; };
  }, [game]);
  const activate = () => { controller.current?.start(); host.current?.focus(); };
  const restart = () => { controller.current?.restart(); host.current?.focus(); };
  const overlay = state.status !== 'playing';
  const ended = state.status === 'over' || state.status === 'won';
  const isMatch = game.mode === 'match';
  const isRace = game.mode === 'race';
  const race = state.race ?? { position: 8, time: 0, speed: 0, progress: 0 };
  const match = state.match ?? { player: 0, cpu: 0 };
  const high = Math.max(state.score, getHighScore(game.id));
  const titles = {
    ready: state.lives < lives ? 'TRY AGAIN.' : game.readyLabel ?? 'READY, PLAYER 01?',
    paused: 'PAUSED.', won: game.winLabel ?? (isRace ? `${ordinal(race.position)} PLACE` : isMatch ? 'YOU WIN' : 'CIRCUIT CLEARED.'), over: isMatch ? 'CPU WINS' : 'GAME OVER.', playing: '',
  };
  return <div className={`game-shell ${game.aspectRatio ? 'portrait-game' : ''} ${isRace ? 'race-game' : ''}`} ref={shell}>
    <div className="game-hud">
      {isRace ? <div className="race-hud"><span>POS <b>{race.position}/8</b></span><span>{raceTime(race.time)}</span><span>{race.progress}%</span></div> : isMatch ? <div className="match-score" aria-label={`PLAYER ${match.player} — ${match.cpu} CPU`}><span>PLAYER <b>{match.player}</b></span><span className="muted">—</span><span><b>{match.cpu}</b> CPU</span></div> : <><ScoreDisplay label="SCORE" score={state.score}/>
      <span aria-label={`${state.lives} lives remaining`} className="lives">{Array.from({ length: lives }, (_, i) => <span className={i >= state.lives ? 'empty' : ''} key={i}>◆</span>)}</span>
      <ScoreDisplay score={high}/></>}
    </div>
    <div className="canvas-wrap" style={game.aspectRatio ? { aspectRatio: game.aspectRatio } : undefined}>
      <div className="phaser-host" ref={host} tabIndex={0} role="application" aria-label={`${game.title} game. ${game.controls}`}/>
      {state.notice && !overlay && <div className="game-notice" role="status"><span>{state.notice}</span></div>}
      {overlay && <div className={`game-overlay ${isRace && loaded && state.status === 'ready' ? 'staging-overlay' : ''}`}>
        <p className="eyebrow">{!loaded ? 'CONNECTING TO THE ARCADE' : state.status === 'ready' ? game.subtitle : game.title.toUpperCase()}</p>
        <h2>{error ? 'LOAD ERROR' : !loaded ? 'LOADING…' : state.prompt?.title ?? titles[state.status]}</h2>
        <p>{error || state.prompt?.detail || (ended ? isRace ? `RACE TIME / ${raceTime(race.time)}` : isMatch ? `FINAL / PLAYER ${match.player} — ${match.cpu} CPU` : `FINAL SCORE / ${String(state.score).padStart(6, '0')}` : game.startHint ?? 'One paddle. One ball. Make every bounce count.')}</p>
        {ended && <div className="end-high">{isRace ? <RaceStatsDisplay gameId={game.id}/> : isMatch ? <MatchStatsDisplay gameId={game.id}/> : <ScoreDisplay label="BEST" score={high}/>}</div>}
        {loaded && <div className="overlay-actions">
          <PixelButton className="primary" onClick={ended && !state.prompt ? restart : activate}>
            {state.prompt?.label ?? (state.status === 'paused' ? 'RESUME' : ended ? 'PLAY AGAIN' : game.launchLabel ?? 'LAUNCH BALL')} <span aria-hidden="true">▶</span>
          </PixelButton>
          {ended && <PixelButton onClick={onBack}>BACK TO ARCADE</PixelButton>}
        </div>}
      </div>}
    </div>
    {game.touchControls && <div className="drive-controls" aria-label={isRace ? 'Touch driving controls' : 'Touch game controls'}>
      {game.touchControls.map(control => <PixelButton key={control.action} disabled={!loaded || state.status !== 'playing'}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); host.current?.focus(); controller.current?.control?.(control.action, true); }}
        onPointerUp={() => controller.current?.control?.(control.action, false)}
        onPointerCancel={() => controller.current?.control?.(control.action, false)}
        onLostPointerCapture={() => controller.current?.control?.(control.action, false)}
        onKeyDown={event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); controller.current?.control?.(control.action, true); } }}
        onKeyUp={() => controller.current?.control?.(control.action, false)}
        onBlur={() => controller.current?.control?.(control.action, false)}>{control.label}</PixelButton>)}
    </div>}
    <div className="game-toolbar">
      <PixelButton disabled={!loaded || !['playing', 'paused'].includes(state.status)} onClick={() => { controller.current?.pause(); host.current?.focus(); }}>
        {state.status === 'paused' ? '▶ RESUME' : 'Ⅱ PAUSE'} <span className="muted">[P]</span>
      </PixelButton>
      <PixelButton disabled={!loaded} onClick={restart}>↻ RESTART</PixelButton>
      {document.fullscreenEnabled && <PixelButton onClick={() => {
        const action = document.fullscreenElement ? document.exitFullscreen() : shell.current?.requestFullscreen();
        action?.catch(() => setFullscreenError('Fullscreen is unavailable in this browser.'));
      }}>⛶ FULLSCREEN</PixelButton>}
    </div>
    {fullscreenError && <p role="status">{fullscreenError}</p>}
    <p className="sr-only" role="status">{isRace ? `${state.status}. Position ${race.position} of 8.` : isMatch ? `${state.status}. Player ${match.player}, CPU ${match.cpu}.` : `${state.status}. Score ${state.score}. ${state.lives} lives remaining.`}</p>
  </div>;
}
