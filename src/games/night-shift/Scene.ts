import Phaser from 'phaser';
import type { GameSnapshot } from '../types';
import { sound } from '../../utils/sound';
import { saveRaceResult } from '../../utils/raceStats';
import { NightRace, type DriveInput } from './model';
import { drawRoad, drawPlayerCar } from './roadArt';
import { drawCockpit } from './cockpit';
import { TRACK_LENGTH, trackAt } from './track';

export class NightShiftScene extends Phaser.Scene {
  race = new NightRace();
  private graphics!: Phaser.GameObjects.Graphics;
  private speedLabel!: Phaser.GameObjects.Text;
  private gearLabel!: Phaser.GameObjects.Text;
  private positionLabel!: Phaser.GameObjects.Text;
  private progressLabel!: Phaser.GameObjects.Text;
  private sectionLabel!: Phaser.GameObjects.Text;
  private viewLabel!: Phaser.GameObjects.Text;
  private held = new Set<string>();
  private touch = new Set<string>();
  private lastSnapshot = '';
  private lastPublish = -100;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private host: HTMLElement, private onChange: (state: GameSnapshot) => void) { super('NightShift'); }
  create() {
    this.graphics = this.add.graphics();
    const text = (x: number, y: number, size: number, color = '#58e6cf') => this.add.text(x, y, '', { fontFamily: 'monospace', fontSize: `${size}px`, color });
    this.speedLabel = text(82, 464, 27); this.gearLabel = text(83, 500, 12, '#aab8cc');
    this.positionLabel = text(554, 466, 23, '#f7ed59'); this.progressLabel = text(554, 501, 12);
    this.sectionLabel = text(18, 18, 12, '#a3bacb');
    this.viewLabel = text(590, 18, 13, '#f7ed59');
    window.addEventListener('keydown', this.keyDown); window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.autoPause); document.addEventListener('visibilitychange', this.visibility);
    this.host.addEventListener('blur', this.clearInput);
    const cleanup = () => {
      window.removeEventListener('keydown', this.keyDown); window.removeEventListener('keyup', this.keyUp);
      window.removeEventListener('blur', this.autoPause); document.removeEventListener('visibilitychange', this.visibility);
      this.host.removeEventListener('blur', this.clearInput); this.clearInput();
      sound.stopMusic();
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup); this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.restart();
  }
  private clearInput = () => { this.held.clear(); this.touch.clear(); };
  private keyDown = (event: KeyboardEvent) => {
    if (!this.host.contains(document.activeElement)) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyR', 'Space', 'KeyP'].includes(event.code)) {
      event.preventDefault();
      if (event.code === 'KeyP' && !event.repeat) this.pause();
      else if (event.code === 'Space' && !event.repeat) this.start();
      else this.held.add(event.code);
    }
  };
  private keyUp = (event: KeyboardEvent) => { this.held.delete(event.code); };
  private visibility = () => { if (document.hidden) this.autoPause(); };
  private autoPause = () => { this.clearInput(); if (['countdown', 'racing', 'finish'].includes(this.race.phase)) this.pause(); };
  control(action: string, pressed: boolean) { if (pressed) this.touch.add(action); else this.touch.delete(action); }
  get rearView() { return this.held.has('KeyR') || this.touch.has('rear'); }
  start() { this.race.start(); sound.startMusic(); this.publish(); }
  pause() { this.race.pause(); this.clearInput(); this.publish(); }
  restart() { this.race = new NightRace(); this.clearInput(); this.lastSnapshot = ''; this.publish(); }
  private readInput(): DriveInput {
    return {
      steer: Number(this.held.has('ArrowRight') || this.held.has('KeyD') || this.touch.has('right')) - Number(this.held.has('ArrowLeft') || this.held.has('KeyA') || this.touch.has('left')),
      accelerate: this.held.has('ArrowUp') || this.held.has('KeyW') || this.touch.has('accelerate'),
      brake: this.held.has('ArrowDown') || this.held.has('KeyS') || this.touch.has('brake'),
    };
  }
  private publish() {
    const r = this.race;
    const status = r.phase === 'ready' ? 'ready' : r.phase === 'paused' ? 'paused' : r.phase === 'results' ? 'won' : 'playing';
    const notice = r.phase === 'countdown' ? String(Math.ceil(r.countdown)) : r.phase === 'racing' && r.elapsed < 0.9 ? 'GO!' : r.phase === 'finish' ? 'FINISH!' : undefined;
    const snapshot: GameSnapshot = { score: 0, lives: 0, status, notice,
      race: { position: r.position, time: r.finishTime || Math.floor(r.elapsed), speed: Math.round(r.player.speed * 3.6), progress: Math.min(100, Math.floor(r.player.distance / TRACK_LENGTH * 100)) } };
    const key = JSON.stringify(snapshot); if (key !== this.lastSnapshot) { this.lastSnapshot = key; this.onChange(snapshot); }
  }
  update(time: number, delta: number) {
    const input = this.readInput(); this.race.step(delta / 1000, input);
    for (const event of this.race.events.splice(0)) {
      if (event === 'finish') saveRaceResult('night-shift', this.race.finishTime, this.race.finalPosition);
    }
    if (time - this.lastPublish > 80) { this.publish(); this.lastPublish = time; }
    this.graphics.clear(); drawRoad(this.graphics, this.race, this.rearView);
    drawPlayerCar(this.graphics, this.race, input.steer, this.rearView, this.reducedMotion);
    drawCockpit(this.graphics, this.race, input.steer, this.reducedMotion);
    this.viewLabel.setText(this.rearView ? 'REAR VIEW / HOLD R' : 'HOLD R / LOOK BACK');
    this.speedLabel.setText(`${Math.round(this.race.player.speed * 3.6).toString().padStart(3, '0')} KM/H`);
    this.gearLabel.setText(`GEAR ${Math.max(1, Math.min(5, Math.ceil(this.race.player.speed / 18)))} / NIGHT RUN`);
    this.positionLabel.setText(`POS ${this.race.position}/8`);
    this.progressLabel.setText(`${Math.min(100, Math.floor(this.race.player.distance / TRACK_LENGTH * 100))}% / 9.9 KM`);
    this.sectionLabel.setText(trackAt(this.race.player.distance).name);
  }
}

