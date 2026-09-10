import Phaser from 'phaser';
import type { GameSnapshot, GameStatus } from '../types';
import { sound, type SoundCue } from '../../utils/sound';
import { saveHighScore } from '../../utils/scores';
import { idleInput } from './config';
import { IronViperRun } from './model';
import { ViperRenderer } from './Renderer';

const controls: Record<string, string> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'crouch', KeyS: 'crouch', Space: 'jump', KeyZ: 'fire', KeyJ: 'fire', KeyX: 'grenade', KeyK: 'grenade' };
const cues: Record<string, SoundCue> = { pulse: 'viperPulse', coil: 'viperCoil', fan: 'viperFan', comet: 'viperRocket', crawler: 'viperCannon', enemyShot: 'viperEnemy', blast: 'viperBlast', damage: 'lost', pickup: 'score', impact: 'hit', grenade: 'viperThrow', checkpoint: 'goal', vehicle: 'viperEngine', boss: 'viperBoss', tick: 'raceCountdown', start: 'start', win: 'win', lost: 'lost', gameover: 'gameover' };
export class IronViperScene extends Phaser.Scene {
  run = new IronViperRun();
  private art!: ViperRenderer;
  private keys = new Set<string>(); private touch = new Set<string>();
  private taps = new Set<string>();
  private lastSnapshot = ''; private savedScore = 0; private soundTimes = new Map<string, number>();
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private parent: HTMLElement, private onChange: (state: GameSnapshot) => void) { super('IronViper'); }
  create() {
    this.art = new ViperRenderer(this);
    window.addEventListener('keydown', this.keyDown); window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.autoPause); document.addEventListener('visibilitychange', this.visibility);
    this.parent.addEventListener('pointerdown', this.focus);
    const cleanup = () => {
      window.removeEventListener('keydown', this.keyDown); window.removeEventListener('keyup', this.keyUp);
      window.removeEventListener('blur', this.autoPause); document.removeEventListener('visibilitychange', this.visibility);
      this.parent.removeEventListener('pointerdown', this.focus); this.clearInput();
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup); this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.emit();
  }
  private focus = () => this.parent.focus({ preventScroll: true });
  private keyDown = (event: KeyboardEvent) => {
    if (!this.parent.contains(document.activeElement)) return;
    if (controls[event.code]) { event.preventDefault(); this.keys.add(event.code); if (!event.repeat) this.taps.add(controls[event.code]); }
    if (event.repeat) return;
    if (event.code === 'KeyP' || event.code === 'Escape') { event.preventDefault(); this.pause(); }
    if (event.code === 'Enter' || event.code === 'Space' && this.run.phase === 'ready') { event.preventDefault(); this.start(); }
  };
  private keyUp = (event: KeyboardEvent) => { this.keys.delete(event.code); };
  private visibility = () => { if (document.hidden) this.autoPause(); };
  private autoPause = () => { if (!['paused', 'ready', 'continue', 'over', 'complete'].includes(this.run.phase)) this.run.pause(); this.clearInput(); this.emit(); };
  private clearInput() { this.keys.clear(); this.touch.clear(); this.taps.clear(); this.run.previousInput = idleInput(); }
  control(action: string, pressed: boolean) { if (pressed) { this.touch.add(action); this.taps.add(action); } else this.touch.delete(action); }
  start() { this.clearInput(); this.run.start(); this.emit(); }
  pause() { this.run.pause(); this.clearInput(); this.emit(); }
  restart() { this.run = new IronViperRun(); this.clearInput(); this.savedScore = 0; this.soundTimes.clear(); this.emit(); }
  private emit() {
    const r = this.run;
    const status: GameStatus = r.phase === 'ready' ? 'ready' : r.phase === 'paused' ? 'paused' : r.phase === 'complete' ? 'won' : r.phase === 'over' || r.phase === 'continue' ? 'over' : 'playing';
    const state: GameSnapshot = { score: r.score, lives: r.lives, status, notice: r.notice };
    if (r.phase === 'continue') state.prompt = { title: `CONTINUE? ${Math.max(0, Math.ceil(r.timer))}`, detail: `${2 - r.continues} free continues remaining. Resume at your checkpoint.`, label: 'CONTINUE' };
    const json = JSON.stringify(state);
    if (r.score > this.savedScore) { saveHighScore('iron-viper', r.score); this.savedScore = r.score; }
    if (json !== this.lastSnapshot) { this.lastSnapshot = json; this.onChange(state); }
  }
  update(_time: number, delta: number) {
    if (!this.art) return;
    const held = (action: string) => this.taps.has(action) || this.touch.has(action) || [...this.keys].some(key => controls[key] === action);
    const input = { move: Number(held('right')) - Number(held('left')), up: held('up'), crouch: held('crouch'), jump: held('jump'), fire: held('fire'), grenade: held('grenade') };
    const dt = Math.min(delta / 1000, 0.05), steps = Math.ceil(dt / (1 / 120));
    if (this.taps.has('jump')) this.run.previousInput.jump = false;
    if (this.taps.has('grenade')) this.run.previousInput.grenade = false;
    for (let i = 0; i < steps; i++) this.run.update(dt / steps, input);
    this.taps.clear();
    if (this.run.phase === 'playing' && this.run.player.vehicle && input.move) this.run.events.push('vehicle');
    for (const event of new Set(this.run.events)) {
      const now = performance.now();
      if (now - (this.soundTimes.get(event) ?? -1000) > (event === 'vehicle' ? 450 : event === 'blast' ? 110 : 65)) {
        if (cues[event]) sound.play(cues[event]); this.soundTimes.set(event, now);
        if (event === 'blast' && !this.reducedMotion) this.cameras.main.shake(100, 0.002);
      }
    }
    this.run.events.length = 0;
    this.art.draw(this.run, input.up, this.reducedMotion); this.emit();
  }
}
