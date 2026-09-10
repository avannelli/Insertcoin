import Phaser from 'phaser';
import type { GameSnapshot, GameStatus, MountGame } from '../types';
import { sound } from '../../utils/sound';
import { saveHighScore } from '../../utils/scores';

export class CircuitBreakScene extends Phaser.Scene {
  score = 0; lives = 3; status: GameStatus = 'ready';
  ball = { x: 400, y: 493, vx: 150, vy: -330 }; paddleX = 400;
  blocks: { x: number; y: number; color: number; active: boolean }[] = [];
  private graphics!: Phaser.GameObjects.Graphics;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  constructor(private onChange: (state: GameSnapshot) => void) { super('CircuitBreak'); }
  create() {
    this.graphics = this.add.graphics();
    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,SPACE,P') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.removeCapture(['SPACE', 'P']);
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === 'KeyP') this.pause();
      if (event.code === 'Space' && !(document.activeElement instanceof HTMLButtonElement)) {
        event.preventDefault(); this.start();
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (pointer.isDown || !pointer.wasTouch) this.paddleX = Phaser.Math.Clamp(pointer.x, 66, 734); });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => { this.paddleX = Phaser.Math.Clamp(pointer.x, 66, 734); if (this.status === 'ready') this.start(); });
    this.game.events.on(Phaser.Core.Events.BLUR, this.autoPause, this);
    this.events.once('shutdown', () => this.game.events.off(Phaser.Core.Events.BLUR, this.autoPause, this));
    this.restart();
  }
  private autoPause() { if (this.status === 'playing') this.pause(); }
  private emit() { saveHighScore('circuit-break', this.score); this.onChange({ score: this.score, lives: this.lives, status: this.status }); }
  restart() {
    this.score = 0; this.lives = 3; this.paddleX = 400;
    this.blocks = Array.from({ length: 40 }, (_, i) => ({ x: 48 + (i % 8) * 89, y: 80 + Math.floor(i / 8) * 33, color: [0xef4db8, 0xef4db8, 0x9b80ca, 0x58e6cf, 0xf7ed59][Math.floor(i / 8)], active: true }));
    this.resetBall(); this.emit();
  }
  private resetBall() { this.status = 'ready'; this.ball = { x: this.paddleX, y: 491, vx: 145, vy: -330 }; }
  start() { if (this.status === 'ready' || this.status === 'paused') { this.status = 'playing'; sound.play('start'); this.emit(); } }
  pause() { if (this.status === 'playing') this.status = 'paused'; else if (this.status === 'paused') this.status = 'playing'; this.emit(); }
  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.035);
    if (this.status === 'playing' || this.status === 'ready') {
      const direction = Number(this.keys.RIGHT.isDown || this.keys.D.isDown) - Number(this.keys.LEFT.isDown || this.keys.A.isDown);
      this.paddleX = Phaser.Math.Clamp(this.paddleX + direction * dt * 620, 66, 734);
    }
    if (this.status === 'ready') this.ball.x = this.paddleX;
    if (this.status === 'playing') {
      // Small physics steps prevent the ball passing through thin blocks at higher speeds.
      const steps = Math.ceil(dt / 0.004);
      for (let i = 0; i < steps && this.status === 'playing'; i++) this.step(dt / steps);
    }
    this.draw();
  }
  private step(dt: number) {
    const b = this.ball, previousY = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < 18) { b.x = 18; b.vx = Math.abs(b.vx); }
    if (b.x > 782) { b.x = 782; b.vx = -Math.abs(b.vx); }
    if (b.y < 20) { b.y = 20; b.vy = Math.abs(b.vy); }
    if (b.vy > 0 && b.y >= 496 && previousY < 496 && Math.abs(b.x - this.paddleX) <= 63) {
      const speed = Math.min(680, Math.hypot(b.vx, b.vy) + 5), angle = Phaser.Math.Clamp((b.x - this.paddleX) / 62, -1, 1) * 1.05;
      b.vx = speed * Math.sin(angle); b.vy = -speed * Math.cos(angle); b.y = 495; sound.play('paddle');
    }
    for (const block of this.blocks) {
      if (!block.active || b.x + 7 < block.x || b.x - 7 > block.x + 80 || b.y + 7 < block.y || b.y - 7 > block.y + 24) continue;
      block.active = false;
      if (previousY + 7 <= block.y || previousY - 7 >= block.y + 24) b.vy *= -1; else b.vx *= -1;
      const speed = Math.hypot(b.vx, b.vy), factor = Math.min(680, speed + 7) / speed;
      b.vx *= factor; b.vy *= factor; this.score += 100; sound.play('hit');
      if (this.blocks.every(item => !item.active)) { this.status = 'won'; sound.play('win'); }
      this.emit(); break;
    }
    if (b.y > 560) { this.lives--; sound.play('lost'); if (this.lives <= 0) { this.status = 'over'; sound.play('gameover'); } else this.resetBall(); this.emit(); }
  }
  private draw() {
    const g = this.graphics; g.clear();
    g.lineStyle(1, 0x302640, 0.45);
    for (let x = 24; x < 800; x += 32) { g.lineBetween(x, 0, x, 560); }
    for (let y = 16; y < 560; y += 32) { g.lineBetween(0, y, 800, y); }
    g.lineStyle(1, 0x635174); g.strokeRect(10, 10, 780, 539);
    for (const block of this.blocks) { if (!block.active) continue; g.fillStyle(block.color); g.fillRect(block.x, block.y, 80, 24); g.fillStyle(0xffffff, 0.18); g.fillRect(block.x, block.y, 80, 3); }
    g.fillStyle(0x58e6cf, 0.10); g.fillRect(this.paddleX - 62, 505, 124, 18);
    g.fillStyle(0x58e6cf); g.fillRect(this.paddleX - 56, 503, 112, 10);
    g.fillStyle(0xf7ed59, 0.12); g.fillCircle(this.ball.x, this.ball.y, 14);
    g.fillStyle(0xf7ed59); g.fillRect(this.ball.x - 6, this.ball.y - 6, 12, 12);
  }
}
export const mount: MountGame = (parent, onChange) => {
  const scene = new CircuitBreakScene(onChange);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: 800, height: 560, backgroundColor: '#171127', scene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: false }, audio: { noAudio: true } });
  return { start: () => scene.start(), pause: () => scene.pause(), restart: () => scene.restart(), destroy: () => game.destroy(true) };
};
