import Phaser from 'phaser';
import type { GameSnapshot } from '../types';
import { sound, type SoundCue } from '../../utils/sound';
import { saveMatchResult } from '../../utils/matchStats';
import { HockeyMatch, TABLE_WIDTH, TABLE_HEIGHT, PADDLE_RADIUS, PUCK_RADIUS } from './model';
import { drawRink } from './rinkArt';

export class AirHockeyScene extends Phaser.Scene {
  match = new HockeyMatch();
  private art!: Phaser.GameObjects.Graphics;
  private held = new Set<string>();
  private lastSnapshot = '';
  private impactUntil = 0;
  private lastImpactSound = -100;
  private trail: { x: number; y: number }[] = [];
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private host: HTMLElement, private onChange: (state: GameSnapshot) => void) { super('AirHockey'); }
  create() {
    drawRink(this.add.graphics());
    this.art = this.add.graphics();
    this.input.on('pointerdown', this.pointerDown, this);
    this.input.on('pointermove', this.pointerMove, this);
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.autoPause);
    document.addEventListener('visibilitychange', this.visibility);
    const cleanup = () => {
      window.removeEventListener('keydown', this.keyDown); window.removeEventListener('keyup', this.keyUp);
      window.removeEventListener('blur', this.autoPause); document.removeEventListener('visibilitychange', this.visibility);
      this.input.off('pointerdown', this.pointerDown, this); this.input.off('pointermove', this.pointerMove, this);
      this.held.clear(); this.trail = [];
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.restart();
  }
  private pointerDown(pointer: Phaser.Input.Pointer) { this.host.focus(); this.pointerMove(pointer); }
  private pointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.wasTouch && !pointer.isDown) return;
    // setTarget clamps to the player's half, so crossing the line pins the paddle instead of dropping it.
    if (this.match.phase === 'playing') this.match.setTarget(pointer.x, pointer.y - (pointer.wasTouch ? 40 : 0));
  }
  private keyDown = (event: KeyboardEvent) => {
    if (!this.host.contains(document.activeElement)) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyP'].includes(event.code)) {
      event.preventDefault();
      if (event.code === 'KeyP' && !event.repeat) this.pause();
      else if (event.code === 'Space' && !event.repeat) this.start();
      else this.held.add(event.code);
    }
  };
  private keyUp = (event: KeyboardEvent) => { this.held.delete(event.code); };
  private visibility = () => { if (document.hidden) this.autoPause(); };
  private autoPause = () => { this.held.clear(); if (['countdown', 'playing', 'goal'].includes(this.match.phase)) this.pause(); };
  start() { this.match.start(); this.publish(); }
  pause() { this.match.pause(); this.held.clear(); this.publish(); }
  restart() {
    this.match = new HockeyMatch(); this.held.clear(); this.trail = []; this.impactUntil = 0;
    this.lastSnapshot = ''; this.publish();
  }
  private publish() {
    const m = this.match;
    const status = m.phase === 'countdown' || m.phase === 'goal' ? 'playing' : m.phase;
    const notice = m.phase === 'countdown' ? (m.remaining > 0.35 ? 'READY' : 'GO!') : m.phase === 'goal' ? (m.goalBy === 'player' ? 'PLAYER GOAL!' : 'CPU GOAL!') : undefined;
    const snapshot: GameSnapshot = { score: m.playerScore, lives: 0, status, match: { player: m.playerScore, cpu: m.cpuScore }, notice };
    const serialized = JSON.stringify(snapshot);
    if (serialized !== this.lastSnapshot) { this.lastSnapshot = serialized; this.onChange(snapshot); }
  }
  update(time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05), m = this.match;
    if (m.phase === 'playing') {
      const x = Number(this.held.has('ArrowRight') || this.held.has('KeyD')) - Number(this.held.has('ArrowLeft') || this.held.has('KeyA'));
      const y = Number(this.held.has('ArrowDown') || this.held.has('KeyS')) - Number(this.held.has('ArrowUp') || this.held.has('KeyW'));
      if (x || y) { const scale = 600 * dt / Math.hypot(x, y); m.setTarget(m.player.x + x * scale, m.player.y + y * scale); }
    }
    m.step(dt);
    for (const event of m.events.splice(0)) {
      if (event === 'win' || event === 'loss') saveMatchResult('air-hockey', m.playerScore, m.cpuScore);
      const cues: Record<typeof event, SoundCue> = { paddle: 'hockeyHit', wall: 'hockeyWall', goal: 'goal', countdown: 'select', go: 'start', win: 'win', loss: 'gameover' };
      if (event === 'paddle' || event === 'wall') {
        this.impactUntil = time + 90;
        if (time - this.lastImpactSound > 65) { sound.play(cues[event]); this.lastImpactSound = time; }
      } else sound.play(cues[event]);
      if (event === 'goal' || event === 'countdown') this.trail = [];
    }
    if (m.phase === 'playing' && !this.reducedMotion) {
      this.trail.unshift({ x: m.puck.x, y: m.puck.y }); if (this.trail.length > 5) this.trail.pop();
    }
    this.publish(); this.draw(time);
  }
  private draw(time: number) {
    const g = this.art, m = this.match;
    g.clear();
    for (const [paddle, color] of [[m.player, 0x58e6cf], [m.cpu, 0xef4db8]] as const) {
      g.fillStyle(color, 0.08); g.fillCircle(paddle.x, paddle.y, PADDLE_RADIUS + 8);
      g.fillStyle(0x080d20); g.fillCircle(paddle.x, paddle.y + 4, PADDLE_RADIUS + 1);
      g.fillStyle(color); g.fillCircle(paddle.x, paddle.y, PADDLE_RADIUS);
      g.lineStyle(2, 0xffffff, 0.35); g.strokeCircle(paddle.x, paddle.y, PADDLE_RADIUS - 5);
      g.fillStyle(0x171127, 0.25); g.fillCircle(paddle.x, paddle.y, 13);
      g.fillStyle(0xffffff, 0.17); g.fillCircle(paddle.x - 3, paddle.y - 4, 8);
    }
    if (m.phase !== 'goal') {
      this.trail.forEach((point, i) => { g.fillStyle(0x253044, (5 - i) * 0.018); g.fillCircle(point.x, point.y, PUCK_RADIUS - i); });
      if (time < this.impactUntil && !this.reducedMotion) { g.lineStyle(2, 0xffffff, 0.5); g.strokeCircle(m.puck.x, m.puck.y, 20); }
      const { x, y } = m.puck;
      g.fillStyle(0x263044, 0.18); g.fillEllipse(x + 2, y + 4, 27, 23);
      g.fillStyle(0x080b10); g.fillCircle(x, y + 2, PUCK_RADIUS);
      g.fillStyle(0x20252c); g.fillCircle(x, y, PUCK_RADIUS);
      g.lineStyle(1, 0x505863, 0.7); g.strokeCircle(x, y, PUCK_RADIUS - 2);
      g.lineStyle(1, 0x79818a, 0.45); g.beginPath(); g.arc(x, y, PUCK_RADIUS - 2, Math.PI * 1.1, Math.PI * 1.7); g.strokePath();
      g.fillStyle(0x11151b); g.fillCircle(x, y, 5);
    }
    if (m.phase === 'goal') {
      g.lineStyle(5, m.goalBy === 'player' ? 0x58e6cf : 0xef4db8, 0.7);
      g.strokeRect(7, 7, TABLE_WIDTH - 14, TABLE_HEIGHT - 14);
    }
  }
}

