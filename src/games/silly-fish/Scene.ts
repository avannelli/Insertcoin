import Phaser from 'phaser';
import type { GameSnapshot, GameStatus } from '../types';
import { sound } from '../../utils/sound';
import { saveHighScore } from '../../utils/scores';
import { FishRun, coralRects, WIDTH, HEIGHT, FISH_X } from './model';
import { drawCoral } from './coralArt';

export class SillyFishScene extends Phaser.Scene {
  run = new FishRun();
  status: GameStatus = 'ready';
  private world!: Phaser.GameObjects.Graphics;
  private fish!: Phaser.GameObjects.Graphics;
  private angle = 0;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private parent: HTMLElement, private onChange: (state: GameSnapshot) => void) { super('SillyFish'); }

  create() {
    this.world = this.add.graphics();
    this.fish = this.add.graphics();
    this.drawFish();
    this.input.on('pointerdown', this.pointerSwim, this);
    // Native focused input avoids capturing Space from menu buttons or scrolling the page.
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('blur', this.autoPause);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    const cleanup = () => {
      window.removeEventListener('keydown', this.keyDown);
      window.removeEventListener('blur', this.autoPause);
      document.removeEventListener('visibilitychange', this.visibilityChanged);
      this.input.off('pointerdown', this.pointerSwim, this);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.restart();
  }
  private keyDown = (event: KeyboardEvent) => {
    if (!this.parent.contains(document.activeElement)) return;
    if (['Space', 'ArrowUp'].includes(event.code)) {
      event.preventDefault();
      if (!event.repeat) this.swim();
    } else if (event.code === 'KeyP' && !event.repeat) this.pause();
  };
  private pointerSwim() { this.parent.focus(); this.swim(); }
  private visibilityChanged = () => { if (document.hidden) this.autoPause(); };
  private autoPause = () => { if (this.status === 'playing') { this.status = 'paused'; this.emit(); } };
  private emit() {
    saveHighScore('silly-fish', this.run.score);
    this.onChange({ score: this.run.score, lives: this.run.alive ? 1 : 0, status: this.status });
  }
  start() {
    if (this.status === 'paused') { this.status = 'playing'; this.emit(); }
    else if (this.status === 'ready') { this.status = 'playing'; this.run.swim(); sound.play('swim'); this.emit(); }
  }
  private swim() {
    if (this.status === 'ready') this.start();
    else if (this.status === 'playing') { this.run.swim(); sound.play('swim'); }
  }
  pause() {
    if (this.status === 'playing') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'playing';
    else return;
    this.emit();
  }
  restart() { this.run = new FishRun(); this.status = 'ready'; this.angle = 0; this.emit(); }
  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.04);
    if (this.status === 'playing') {
      const steps = Math.ceil(dt / 0.008);
      for (let i = 0; i < steps && this.status === 'playing'; i++) {
        const event = this.run.step(dt / steps);
        if (event === 'score') { sound.play('score'); this.emit(); }
        if (event === 'over') { this.status = 'over'; sound.play('gameover'); this.emit(); }
      }
      const target = Phaser.Math.Clamp(this.run.velocity / 620, -0.38, 0.65);
      this.angle = Phaser.Math.Linear(this.angle, target, Math.min(1, dt * 12));
    }
    this.drawWorld();
    this.fish.setPosition(FISH_X, this.run.y).setRotation(this.angle);
  }
  private drawFish() {
    const g = this.fish;
    g.fillStyle(0xffa94e); g.fillTriangle(-17, 0, -34, -14, -34, 14);
    g.fillStyle(0xf7ed59); g.fillTriangle(-5, -11, 5, -24, 15, -10);
    g.fillStyle(0xffa94e); g.fillEllipse(0, 0, 46, 31);
    g.fillStyle(0xfff1c9); g.fillRoundedRect(-12, -13, 7, 26, 3); g.fillRoundedRect(6, -13, 6, 26, 3);
    g.fillStyle(0xf7ed59); g.fillTriangle(-2, 2, -12, 14, 6, 11);
    g.fillStyle(0x171127); g.fillCircle(16, -4, 4);
    g.fillStyle(0xffffff); g.fillCircle(17, -5, 1.5);
    g.lineStyle(1.5, 0x9f4e50); g.lineBetween(16, 7, 21, 5);
  }
  private drawWorld() {
    const g = this.world, distance = this.reducedMotion ? 0 : this.run.distance;
    g.clear();
    g.fillGradientStyle(0x131c35, 0x17152d, 0x20132e, 0x151b32, 1); g.fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(0x58e6cf, 0.025);
    for (let i = 0; i < 5; i++) g.fillTriangle(i * 220 - 60, 0, i * 220 + 25, 0, i * 220 + 120, HEIGHT);
    for (let i = 0; i < 17; i++) {
      const x = ((i * 79 - distance * 0.15) % 880 + 880) % 880 - 40;
      const height = 30 + (i * 37) % 85;
      g.fillStyle(0x43304f, 0.5); g.fillRoundedRect(x, HEIGHT - height, 13, height + 10, 6);
      g.fillRoundedRect(x - 14, HEIGHT - height + 30, 18, 10, 4);
    }
    g.lineStyle(1, 0x58e6cf, 0.18);
    for (let i = 0; i < 24; i++) {
      const x = ((i * 137 - distance * 0.25) % 820 + 820) % 820;
      const y = ((i * 83 - distance * 0.18) % 580 + 580) % 580;
      g.strokeCircle(x, y, 2 + i % 4);
    }
    for (const pair of this.run.pairs) {
      drawCoral(g, pair, coralRects(pair));
    }
    g.lineStyle(2, 0x58e6cf, 0.25); g.lineBetween(0, 1, WIDTH, 1); g.lineBetween(0, HEIGHT - 1, WIDTH, HEIGHT - 1);
    if (this.status === 'playing') {
      g.lineStyle(1, 0x58e6cf, 0.4); g.strokeCircle(FISH_X - 44, this.run.y + 5, 3);
    }
  }
}
