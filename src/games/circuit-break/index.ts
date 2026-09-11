import Phaser from 'phaser';
import type { GameSnapshot, GameStatus, MountGame } from '../types';
import { sound } from '../../utils/sound';
import { saveHighScore } from '../../utils/scores';

const FIELD_WIDTH = 800;
const WALL_LEFT = 18, WALL_RIGHT = 782, WALL_TOP = 20;
const PADDLE_HALF = 63, PADDLE_WIDE_HALF = 88, PADDLE_THICK = 15;
const PADDLE_SPEED = 720, PADDLE_ACCEL = 5600;
const BALL_HALF = 7, BASE_SPEED = 360, MAX_SPEED = 640, SPEED_GAIN = 5;
const BLOCK_WIDTH = 80, BLOCK_HEIGHT = 24;
const ROW_COLORS = [0xef4db8, 0xef4db8, 0x9b80ca, 0x58e6cf, 0xf7ed59];
const PHYSICS_STEP = 1 / 240;
const CAPSULE_SPEED = 165, CAPSULE_HALF_W = 21, CAPSULE_HALF_H = 11;
const WIDE_SECONDS = 14, SLOW_SECONDS = 10;

// 3x5 pixel glyphs, one bitmask per row, stamped as square pixels.
const GLYPHS: Record<string, number[]> = {
  A: [0b010, 0b101, 0b111, 0b101, 0b101], B: [0b110, 0b101, 0b110, 0b101, 0b110],
  C: [0b011, 0b100, 0b100, 0b100, 0b011], D: [0b110, 0b101, 0b101, 0b101, 0b110],
  E: [0b111, 0b100, 0b110, 0b100, 0b111], F: [0b111, 0b100, 0b110, 0b100, 0b100],
  G: [0b011, 0b100, 0b101, 0b101, 0b011], H: [0b101, 0b101, 0b111, 0b101, 0b101],
  I: [0b111, 0b010, 0b010, 0b010, 0b111], J: [0b001, 0b001, 0b001, 0b101, 0b010],
  K: [0b101, 0b101, 0b110, 0b101, 0b101], L: [0b100, 0b100, 0b100, 0b100, 0b111],
  M: [0b101, 0b111, 0b111, 0b101, 0b101], N: [0b101, 0b111, 0b111, 0b111, 0b101],
  O: [0b010, 0b101, 0b101, 0b101, 0b010], P: [0b110, 0b101, 0b110, 0b100, 0b100],
  Q: [0b010, 0b101, 0b101, 0b110, 0b011], R: [0b110, 0b101, 0b110, 0b101, 0b101],
  S: [0b011, 0b100, 0b010, 0b001, 0b110], T: [0b111, 0b010, 0b010, 0b010, 0b010],
  U: [0b101, 0b101, 0b101, 0b101, 0b011], V: [0b101, 0b101, 0b101, 0b101, 0b010],
  W: [0b101, 0b101, 0b111, 0b111, 0b101], X: [0b101, 0b101, 0b010, 0b101, 0b101],
  Y: [0b101, 0b101, 0b010, 0b010, 0b010], Z: [0b111, 0b001, 0b010, 0b100, 0b111],
  '0': [0b111, 0b101, 0b101, 0b101, 0b111], '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111], '3': [0b111, 0b001, 0b011, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001], '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111], '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111], '9': [0b111, 0b101, 0b111, 0b001, 0b111],
  '+': [0b000, 0b010, 0b111, 0b010, 0b000], '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  '_': [0b000, 0b000, 0b000, 0b000, 0b111], '.': [0b000, 0b000, 0b000, 0b000, 0b010],
  ' ': [0, 0, 0, 0, 0],
};

type PowerKind = 'wide' | 'slow' | 'bonus';
const POWERS: Record<PowerKind, { label: string; color: number; glyph: string; seconds: number }> = {
  wide: { label: 'WIDE', color: 0x58e6cf, glyph: 'W', seconds: WIDE_SECONDS },
  slow: { label: 'SLOW', color: 0x9b80ca, glyph: 'S', seconds: SLOW_SECONDS },
  bonus: { label: 'BONUS', color: 0xf7ed59, glyph: '+', seconds: 0 },
};

interface Spark { x: number; y: number; vx: number; vy: number; life: number; span: number; color: number; size: number }
interface Shard { x: number; y: number; w: number; h: number; vx: number; vy: number; life: number; span: number; color: number }
interface Ripple { x: number; y: number; life: number; span: number; color: number; width: number }
interface Popup { x: number; y: number; text: string; life: number; span: number; color: number; scale: number }
interface Capsule { x: number; y: number; kind: PowerKind; phase: number }

export class CircuitBreakScene extends Phaser.Scene {
  score = 0; lives = 3; status: GameStatus = 'ready';
  fieldHeight = 560;
  resizeField(height: number) {
    const next = Math.max(560, height);
    this.ball.y = this.status === 'ready' ? next - 69 : Math.min(next - 65, this.ball.y * next / this.fieldHeight);
    this.fieldHeight = next;
  }
  movePaddle(position: number) {
    if (this.status !== 'ready' && this.status !== 'playing') return;
    const [min, max] = this.travel();
    this.paddleX = min + Phaser.Math.Clamp(position, 0, 1) * (max - min);
    this.parkBall();
  }
  // The rail shortens as the paddle grows, so a wide paddle never hangs off the deck.
  private travel(): [number, number] {
    return [WALL_LEFT + this.paddleHalf - 15, WALL_RIGHT - this.paddleHalf + 15];
  }
  ball = { x: 400, y: 493, vx: 150, vy: -330 }; paddleX = 400;
  blocks: { x: number; y: number; color: number; active: boolean }[] = [];
  private paddleHalf = PADDLE_HALF;
  private keyVelocity = 0;
  private carry = 0;
  private clock = 0;
  private ballSpeed = BASE_SPEED;
  private combo = 0;
  private comboPulse = 0;
  private serve = 1;
  private wideUntil = 0;
  private slowUntil = 0;
  private trail: { x: number; y: number }[] = [];
  private sparks: Spark[] = [];
  private shards: Shard[] = [];
  private ripples: Ripple[] = [];
  private popups: Popup[] = [];
  private capsules: Capsule[] = [];
  private flash = 0;
  private damage = 0;
  private victory = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (pointer.isDown || !pointer.wasTouch) this.aimPaddle(pointer.x); });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => { this.aimPaddle(pointer.x); if (this.status === 'ready') this.start(); });
    this.game.events.on(Phaser.Core.Events.BLUR, this.autoPause, this);
    this.events.once('shutdown', () => this.game.events.off(Phaser.Core.Events.BLUR, this.autoPause, this));
    this.restart();
  }
  private aimPaddle(x: number) { this.paddleX = Phaser.Math.Clamp(x, ...this.travel()); this.parkBall(); }
  private autoPause() { if (this.status === 'playing') this.pause(); }
  private emit() { saveHighScore('circuit-break', this.score); this.onChange({ score: this.score, lives: this.lives, status: this.status }); }
  restart() {
    this.score = 0; this.lives = 3; this.paddleX = 400; this.keyVelocity = 0; this.serve = 1;
    this.trail = []; this.sparks = []; this.shards = []; this.ripples = []; this.popups = []; this.capsules = [];
    this.flash = 0; this.damage = 0; this.victory = 0; this.carry = 0; this.combo = 0; this.comboPulse = 0;
    this.blocks = Array.from({ length: 40 }, (_, i) => ({ x: 48 + (i % 8) * 89, y: 80 + Math.floor(i / 8) * 33, color: ROW_COLORS[Math.floor(i / 8)], active: true }));
    this.resetBall(); this.emit();
  }
  private clearPowers() { this.paddleHalf = PADDLE_HALF; this.wideUntil = 0; this.slowUntil = 0; this.reseat(); }
  private reseat() { this.paddleX = Phaser.Math.Clamp(this.paddleX, ...this.travel()); }
  private resetBall() {
    this.status = 'ready'; this.ballSpeed = BASE_SPEED; this.combo = 0;
    this.trail = []; this.capsules = []; this.clearPowers();
    this.ball = { x: this.paddleX, y: this.fieldHeight - 69, vx: 145, vy: -330 };
    this.parkBall();
  }
  // The serve leans away from the wall you are parked against, so where you wait is a real choice.
  private parkBall() {
    if (this.status !== 'ready') return;
    const offset = Phaser.Math.Clamp((this.paddleX - 400) / 334, -1, 1);
    let angle = -offset * 0.62;
    if (Math.abs(angle) < 0.22) angle = 0.22 * this.serve;
    this.ball.x = this.paddleX;
    this.ball.y = this.fieldHeight - 69;
    this.ball.vx = BASE_SPEED * Math.sin(angle);
    this.ball.vy = -BASE_SPEED * Math.cos(angle);
  }
  start() {
    if (this.status !== 'ready' && this.status !== 'paused') return;
    if (this.status === 'ready') this.serve *= -1;
    this.status = 'playing'; sound.play('start'); this.emit();
  }
  pause() { if (this.status === 'playing') this.status = 'paused'; else if (this.status === 'paused') this.status = 'playing'; this.emit(); }
  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    this.clock += dt;
    if (this.status === 'playing' || this.status === 'ready') this.drivePaddle(dt);
    if (this.status === 'ready') this.parkBall();
    if (this.status === 'playing') {
      this.expirePowers();
      // A fixed physics step keeps the ball's speed identical on every refresh rate.
      this.carry = Math.min(this.carry + dt, 0.25);
      while (this.carry >= PHYSICS_STEP && this.status === 'playing') { this.step(PHYSICS_STEP); this.carry -= PHYSICS_STEP; }
      this.trail.unshift({ x: this.ball.x, y: this.ball.y });
      if (this.trail.length > 14) this.trail.pop();
      this.driveCapsules(dt);
    }
    this.advanceEffects(dt);
    this.draw();
  }
  // Keyboard steering ramps up and settles instead of snapping between stop and full speed.
  private drivePaddle(dt: number) {
    const direction = Number(this.keys?.RIGHT.isDown || this.keys?.D.isDown) - Number(this.keys?.LEFT.isDown || this.keys?.A.isDown);
    const target = direction * PADDLE_SPEED;
    const rate = direction ? PADDLE_ACCEL : PADDLE_ACCEL * 1.8;
    this.keyVelocity = Phaser.Math.Linear(this.keyVelocity, target, Math.min(1, rate * dt / PADDLE_SPEED));
    if (Math.abs(this.keyVelocity) < 4) this.keyVelocity = 0;
    if (this.keyVelocity) this.paddleX = Phaser.Math.Clamp(this.paddleX + this.keyVelocity * dt, ...this.travel());
  }
  private expirePowers() {
    if (this.wideUntil && this.clock > this.wideUntil) { this.wideUntil = 0; this.paddleHalf = PADDLE_HALF; this.reseat(); }
    if (this.slowUntil && this.clock > this.slowUntil) { this.slowUntil = 0; this.setSpeed(this.ballSpeed); }
  }
  private driveCapsules(dt: number) {
    const top = this.fieldHeight - 64, bottom = top + PADDLE_THICK;
    for (const capsule of this.capsules) { capsule.y += CAPSULE_SPEED * dt; capsule.phase += dt * 6; }
    this.capsules = this.capsules.filter(capsule => {
      const caught = capsule.y + CAPSULE_HALF_H >= top && capsule.y - CAPSULE_HALF_H <= bottom
        && Math.abs(capsule.x - this.paddleX) <= this.paddleHalf + CAPSULE_HALF_W;
      if (caught) this.collect(capsule);
      return !caught && capsule.y - CAPSULE_HALF_H < this.fieldHeight;
    });
  }
  private collect(capsule: Capsule) {
    const power = POWERS[capsule.kind];
    sound.play('select');
    this.popups.push({ x: capsule.x, y: capsule.y - 16, text: power.label, life: 0.9, span: 0.9, color: power.color, scale: 3 });
    this.ripples.push({ x: capsule.x, y: capsule.y, life: 0.35, span: 0.35, color: power.color, width: 3 });
    if (capsule.kind === 'wide') { this.paddleHalf = PADDLE_WIDE_HALF; this.wideUntil = this.clock + WIDE_SECONDS; this.reseat(); }
    if (capsule.kind === 'slow') { this.slowUntil = this.clock + SLOW_SECONDS; this.setSpeed(this.ballSpeed); }
    if (capsule.kind === 'bonus') { this.score += 300; this.emit(); }
  }
  private advanceEffects(dt: number) {
    for (const spark of this.sparks) { spark.life -= dt; spark.vy += 900 * dt; spark.x += spark.vx * dt; spark.y += spark.vy * dt; }
    this.sparks = this.sparks.filter(spark => spark.life > 0);
    for (const shard of this.shards) { shard.life -= dt; shard.vy += 760 * dt; shard.x += shard.vx * dt; shard.y += shard.vy * dt; }
    this.shards = this.shards.filter(shard => shard.life > 0);
    for (const ripple of this.ripples) ripple.life -= dt;
    this.ripples = this.ripples.filter(ripple => ripple.life > 0);
    for (const popup of this.popups) { popup.life -= dt; popup.y -= 46 * dt; }
    this.popups = this.popups.filter(popup => popup.life > 0);
    this.flash = Math.max(0, this.flash - dt * 4);
    this.damage = Math.max(0, this.damage - dt * 1.6);
    this.comboPulse = Math.max(0, this.comboPulse - dt * 2.2);
    if (this.status === 'won') this.victory = Math.min(1, this.victory + dt * 2);
  }
  private burst(x: number, y: number, color: number, count = 10) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random(), speed = 70 + Math.random() * 190;
      this.sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, life: 0.3 + Math.random() * 0.35, span: 0.65, color, size: 2 + Math.random() * 3 });
    }
  }
  // A broken block comes apart into its own quarters before the sparks scatter.
  private shatter(block: { x: number; y: number; color: number }) {
    if (this.reducedMotion) return;
    const w = BLOCK_WIDTH / 4, h = BLOCK_HEIGHT / 2;
    for (let col = 0; col < 4; col++) for (let row = 0; row < 2; row++) {
      const offsetX = block.x + col * w + w / 2 - (block.x + BLOCK_WIDTH / 2);
      const offsetY = block.y + row * h + h / 2 - (block.y + BLOCK_HEIGHT / 2);
      this.shards.push({
        x: block.x + col * w, y: block.y + row * h, w, h, color: block.color,
        vx: offsetX * 4.6 + (Math.random() - 0.5) * 60,
        vy: offsetY * 6 - 120 - Math.random() * 80,
        life: 0.38 + Math.random() * 0.22, span: 0.6,
      });
    }
  }
  private setSpeed(speed: number) {
    const b = this.ball, current = Math.hypot(b.vx, b.vy) || 1;
    const scale = (this.slowUntil ? speed * 0.68 : speed) / current;
    b.vx *= scale; b.vy *= scale;
  }
  step(dt: number) {
    const b = this.ball, previousY = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < WALL_LEFT) { b.x = WALL_LEFT; b.vx = Math.abs(b.vx); this.onWall(b.x, b.y); }
    if (b.x > WALL_RIGHT) { b.x = WALL_RIGHT; b.vx = -Math.abs(b.vx); this.onWall(b.x, b.y); }
    if (b.y < WALL_TOP) { b.y = WALL_TOP; b.vy = Math.abs(b.vy); this.onWall(b.x, b.y); }
    this.hitPaddle(previousY);
    this.hitBlocks(previousY);
    if (b.y > this.fieldHeight) this.loseBall();
  }
  // The paddle is a surface like any other: reflect off whichever face was actually struck.
  private hitPaddle(previousY: number) {
    const b = this.ball, top = this.fieldHeight - 64, bottom = top + PADDLE_THICK;
    const left = this.paddleX - this.paddleHalf, right = this.paddleX + this.paddleHalf;
    if (b.x + BALL_HALF < left || b.x - BALL_HALF > right || b.y + BALL_HALF < top || b.y - BALL_HALF > bottom) return;
    const overlapX = Math.min(b.x + BALL_HALF - left, right - (b.x - BALL_HALF));
    const overlapY = Math.min(b.y + BALL_HALF - top, bottom - (b.y - BALL_HALF));
    const crossedTop = previousY + BALL_HALF <= top;
    if (crossedTop || overlapY <= overlapX) {
      if (b.vy <= 0) return;
      b.vy = -Math.abs(b.vy); b.y = top - BALL_HALF;
    } else {
      const side = Math.sign(b.x - this.paddleX) || 1;
      b.vx = side * Math.abs(b.vx);
      b.x = this.paddleX + side * (this.paddleHalf + BALL_HALF);
    }
    this.combo = 0;
    this.ripples.push({ x: b.x, y: top, life: 0.24, span: 0.24, color: 0x58e6cf, width: 2 });
    sound.play('paddle');
  }
  // Resolve the block the ball entered least deeply: that is the face it actually crossed.
  private hitBlocks(previousY: number) {
    const b = this.ball;
    let target: typeof this.blocks[number] | undefined, bestDepth = Infinity, bestAxis: 'x' | 'y' = 'y';
    for (const block of this.blocks) {
      if (!block.active) continue;
      const overlapX = Math.min(b.x + BALL_HALF - block.x, block.x + BLOCK_WIDTH - (b.x - BALL_HALF));
      const overlapY = Math.min(b.y + BALL_HALF - block.y, block.y + BLOCK_HEIGHT - (b.y - BALL_HALF));
      if (overlapX <= 0 || overlapY <= 0) continue;
      const crossedVertically = previousY + BALL_HALF <= block.y || previousY - BALL_HALF >= block.y + BLOCK_HEIGHT;
      const axis: 'x' | 'y' = crossedVertically || overlapY <= overlapX ? 'y' : 'x';
      const depth = axis === 'y' ? overlapY : overlapX;
      if (depth < bestDepth) { bestDepth = depth; target = block; bestAxis = axis; }
    }
    if (!target) return;
    target.active = false;
    if (bestAxis === 'y') {
      b.vy *= -1;
      b.y = b.vy > 0 ? target.y + BLOCK_HEIGHT + BALL_HALF : target.y - BALL_HALF;
    } else {
      b.vx *= -1;
      b.x = b.vx > 0 ? target.x + BLOCK_WIDTH + BALL_HALF : target.x - BALL_HALF;
    }
    this.ballSpeed = Math.min(MAX_SPEED, this.ballSpeed + SPEED_GAIN);
    this.setSpeed(this.ballSpeed);
    this.normalise();
    this.combo++; this.comboPulse = 1;
    const points = 100 * this.combo;
    this.score += points;
    sound.play('hit');
    const cx = target.x + BLOCK_WIDTH / 2, cy = target.y + BLOCK_HEIGHT / 2;
    this.shatter(target);
    this.burst(cx, cy, target.color);
    this.ripples.push({ x: cx, y: cy, life: 0.3, span: 0.3, color: target.color, width: 2 });
    this.popups.push({ x: cx, y: cy, text: `+${points}`, life: 0.62, span: 0.62, color: this.combo > 1 ? 0xf7ed59 : target.color, scale: this.combo > 2 ? 3 : 2 });
    this.flash = Math.min(1, this.flash + 0.55);
    this.cameras?.main?.shake?.(this.reducedMotion ? 0 : 80, 0.0016);
    this.maybeDrop(cx, cy);
    if (this.blocks.every(item => !item.active)) { this.status = 'won'; this.victory = 0; sound.play('win'); }
    this.emit();
  }
  // Every sixth block cleared releases a capsule, cycling through the three kinds.
  private maybeDrop(x: number, y: number) {
    const cleared = this.blocks.filter(block => !block.active).length;
    if (cleared % 6 !== 3 || this.capsules.length >= 2) return;
    const kinds: PowerKind[] = ['wide', 'slow', 'bonus'];
    this.capsules.push({ x, y, kind: kinds[Math.floor(cleared / 6) % kinds.length], phase: 0 });
  }
  private loseBall() {
    this.lives--; sound.play('lost'); this.damage = 1; this.combo = 0;
    this.burst(this.ball.x, this.fieldHeight - 8, 0xef4db8, 14);
    if (this.lives <= 0) { this.status = 'over'; sound.play('gameover'); } else this.resetBall();
    this.emit();
  }
  private onWall(x: number, y: number) { this.ripples.push({ x, y, life: 0.18, span: 0.18, color: 0x9b80ca, width: 2 }); }
  // Keep a real vertical component so the ball can never settle into a flat, unplayable rally.
  private normalise() {
    const b = this.ball, speed = Math.hypot(b.vx, b.vy) || BASE_SPEED;
    const floor = speed * 0.34;
    if (Math.abs(b.vy) < floor) b.vy = Math.sign(b.vy || -1) * floor;
    const scale = speed / Math.hypot(b.vx, b.vy);
    b.vx *= scale; b.vy *= scale;
  }

  private text(value: string, x: number, y: number, scale: number, color: number, alpha = 1, anchor: 'left' | 'center' | 'right' = 'left') {
    const g = this.graphics, width = value.length * 4 * scale - scale;
    let cursor = Math.round(anchor === 'center' ? x - width / 2 : anchor === 'right' ? x - width : x);
    g.fillStyle(color, alpha);
    for (const char of value.toUpperCase()) {
      const glyph = GLYPHS[char];
      if (glyph) for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) {
        if (glyph[row] & (1 << (2 - col))) g.fillRect(cursor + col * scale, y + row * scale, scale, scale);
      }
      cursor += 4 * scale;
    }
  }
  private draw() {
    const g = this.graphics, height = this.fieldHeight;
    g.clear();
    this.drawBoard(height);
    this.drawBlocks();
    for (const shard of this.shards) {
      const t = shard.life / shard.span;
      g.fillStyle(shard.color, Math.max(0, t));
      g.fillRect(shard.x, shard.y, shard.w * t, shard.h * t);
    }
    for (const ripple of this.ripples) {
      const t = 1 - ripple.life / ripple.span;
      g.lineStyle(ripple.width, ripple.color, (1 - t) * 0.75); g.strokeCircle(ripple.x, ripple.y, 6 + t * 34);
    }
    for (const spark of this.sparks) {
      const t = spark.life / spark.span;
      g.fillStyle(spark.color, Math.max(0, t));
      g.fillRect(spark.x - spark.size / 2, spark.y - spark.size / 2, spark.size, spark.size);
    }
    this.drawCapsules();
    this.drawBall();
    this.drawPaddle(height);
    this.drawOverlay(height);
  }
  private drawBoard(height: number) {
    const g = this.graphics;
    // Deep cabinet backdrop with a glowing circuit grid.
    g.fillGradientStyle(0x241a3f, 0x1d1536, 0x120e26, 0x150f2b, 1);
    g.fillRect(0, 0, FIELD_WIDTH, height);
    g.lineStyle(1, 0x58e6cf, 0.07);
    for (let x = 24; x < FIELD_WIDTH; x += 32) g.lineBetween(x, 0, x, height);
    for (let y = 16; y < height; y += 32) g.lineBetween(0, y, FIELD_WIDTH, y);
    g.lineStyle(1, 0xef4db8, 0.09);
    for (let y = 16; y < height; y += 128) g.lineBetween(0, y, FIELD_WIDTH, y);
    // Data pulses running the traces, so the board is never completely still.
    const bandTop = 244, bandBottom = height - 92;
    if (!this.reducedMotion && bandBottom > bandTop) {
      g.fillStyle(0x58e6cf, 0.45);
      for (let lane = 0; lane < 3; lane++) {
        const y = Math.round((bandTop + (bandBottom - bandTop) * (lane + 0.5) / 3 - 16) / 32) * 32 + 16;
        const direction = lane % 2 ? -1 : 1;
        const travel = ((this.clock * (86 + lane * 41) + lane * 280) % (FIELD_WIDTH + 140)) - 70;
        const head = direction > 0 ? travel : FIELD_WIDTH - travel;
        for (let i = 0; i < 5; i++) g.fillRect(head - direction * i * 9, y - 1, 6, 2);
      }
    }
    // Solder pads along the rails.
    g.fillStyle(0x58e6cf, 0.16);
    for (let y = 46; y < height - 40; y += 64) { g.fillRect(6, y, 5, 5); g.fillRect(FIELD_WIDTH - 11, y, 5, 5); }
    // Frame, corner brackets and the deck legend.
    g.lineStyle(2, 0x6d5a86, 0.85); g.strokeRect(10, 10, 780, height - 21);
    g.lineStyle(3, 0x58e6cf, 0.65);
    for (const [cx, cy, sx, sy] of [[10, 10, 1, 1], [790, 10, -1, 1], [10, height - 11, 1, -1], [790, height - 11, -1, -1]] as const) {
      g.lineBetween(cx, cy, cx + 26 * sx, cy); g.lineBetween(cx, cy, cx, cy + 26 * sy);
    }
    this.text('CIRCUIT_01', 28, 38, 2, 0x58e6cf, 0.5);
    const remaining = String(this.blocks.filter(block => block.active).length).padStart(2, '0');
    this.text(`${remaining} LEFT`, FIELD_WIDTH - 28, 38, 2, 0x9b80ca, 0.55, 'right');
  }
  private drawBlocks() {
    const g = this.graphics;
    for (const block of this.blocks) {
      if (!block.active) continue;
      g.fillStyle(block.color, 0.18); g.fillRect(block.x - 3, block.y - 3, BLOCK_WIDTH + 6, BLOCK_HEIGHT + 6);
      g.fillStyle(0x090715); g.fillRect(block.x + 2, block.y + 3, BLOCK_WIDTH, BLOCK_HEIGHT);
      g.fillStyle(block.color); g.fillRect(block.x, block.y, BLOCK_WIDTH, BLOCK_HEIGHT);
      g.fillStyle(0xffffff, 0.34); g.fillRect(block.x, block.y, BLOCK_WIDTH, 4);
      g.fillStyle(0x000000, 0.3); g.fillRect(block.x, block.y + BLOCK_HEIGHT - 4, BLOCK_WIDTH, 4);
      g.fillStyle(0x090715, 0.5);
      for (let i = 0; i < 3; i++) g.fillRect(block.x + 18 + i * 22, block.y + 9, 10, BLOCK_HEIGHT - 18);
      g.fillStyle(0xffffff, 0.5); g.fillRect(block.x + 4, block.y + 6, 3, 3);
    }
  }
  private drawCapsules() {
    const g = this.graphics;
    for (const capsule of this.capsules) {
      const power = POWERS[capsule.kind], bob = Math.sin(capsule.phase) * 2, y = capsule.y + bob;
      g.fillStyle(power.color, 0.2); g.fillRect(capsule.x - CAPSULE_HALF_W - 3, y - CAPSULE_HALF_H - 3, CAPSULE_HALF_W * 2 + 6, CAPSULE_HALF_H * 2 + 6);
      g.fillStyle(0x090715); g.fillRect(capsule.x - CAPSULE_HALF_W, y - CAPSULE_HALF_H, CAPSULE_HALF_W * 2, CAPSULE_HALF_H * 2);
      g.fillStyle(power.color); g.fillRect(capsule.x - CAPSULE_HALF_W + 2, y - CAPSULE_HALF_H + 2, CAPSULE_HALF_W * 2 - 4, CAPSULE_HALF_H * 2 - 4);
      g.fillStyle(0xffffff, 0.45); g.fillRect(capsule.x - CAPSULE_HALF_W + 2, y - CAPSULE_HALF_H + 2, CAPSULE_HALF_W * 2 - 4, 3);
      this.text(power.glyph, capsule.x, y - 5, 2, 0x090715, 1, 'center');
    }
  }
  private drawBall() {
    const g = this.graphics, b = this.ball;
    this.trail.forEach((point, i) => {
      const t = 1 - i / this.trail.length, size = 12 * t;
      g.fillStyle(this.slowUntil ? 0x9b80ca : 0xf7ed59, 0.3 * t * t);
      g.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    });
    const core = this.slowUntil ? 0xc3a9f5 : 0xf7ed59;
    const pulse = 0.5 + Math.sin(this.clock * 9) * 0.12;
    g.fillStyle(core, 0.1 + pulse * 0.09); g.fillCircle(b.x, b.y, 17);
    g.fillStyle(0xfff8b8, 0.5); g.fillRect(b.x - 7, b.y - 7, 14, 14);
    g.fillStyle(core); g.fillRect(b.x - 5, b.y - 5, 10, 10);
    g.fillStyle(0xfffdf0); g.fillRect(b.x - 2, b.y - 3, 4, 4);
    // Aim guide while the ball is parked on the paddle.
    if (this.status === 'ready') {
      const launch = Math.hypot(b.vx, b.vy) || 1, dx = b.vx / launch, dy = b.vy / launch;
      for (let i = 0; i < 7; i++) {
        const distance = 26 + i * 19, fade = 0.45 - i * 0.055;
        g.fillStyle(0x58e6cf, Math.max(0.05, fade));
        g.fillRect(b.x + dx * distance - 1.5, b.y + dy * distance - 4.5, 3, 9);
      }
    }
  }
  private drawPaddle(height: number) {
    const g = this.graphics, half = this.paddleHalf, y = height - 59;
    // The rail the paddle rides, then the paddle itself.
    g.fillStyle(0x58e6cf, 0.1); g.fillRect(22, y + 6, FIELD_WIDTH - 44, 2);
    g.fillStyle(0x58e6cf, 0.22);
    for (let x = 30; x < FIELD_WIDTH - 30; x += 26) g.fillRect(x, y + 5, 9, 3);
    g.fillStyle(0x58e6cf, this.wideUntil ? 0.26 : 0.16); g.fillRect(this.paddleX - half - 7, y - 6, half * 2 + 14, 28);
    g.fillStyle(0x06161c); g.fillRect(this.paddleX - half + 5, y + 4, half * 2 - 10, 13);
    g.fillStyle(0x2aa79a); g.fillRect(this.paddleX - half, y, half * 2, PADDLE_THICK);
    g.fillStyle(0x58e6cf); g.fillRect(this.paddleX - half, y, half * 2, 11);
    g.fillStyle(0xe4fffa); g.fillRect(this.paddleX - half, y, half * 2, 4);
    g.fillStyle(0xf7ed59); g.fillRect(this.paddleX - half, y, 11, PADDLE_THICK); g.fillRect(this.paddleX + half - 11, y, 11, PADDLE_THICK);
    g.fillStyle(0xfffdf0, 0.7); g.fillRect(this.paddleX - half, y, 11, 4); g.fillRect(this.paddleX + half - 11, y, 11, 4);
    g.fillStyle(0x06161c, 0.5);
    for (let i = -2; i <= 2; i++) g.fillRect(this.paddleX + i * 16 - 1, y + 5, 2, 6);
  }
  private drawOverlay(height: number) {
    const g = this.graphics;
    for (const popup of this.popups) {
      this.text(popup.text, popup.x, popup.y, popup.scale, popup.color, Math.min(1, (popup.life / popup.span) * 1.6), 'center');
    }
    // Combo ladder, shown only while a rally is actually building.
    if (this.combo > 1 && this.status === 'playing') {
      this.text(`X${this.combo}`, FIELD_WIDTH / 2, 40, Math.round(3 + this.comboPulse * 1.4), 0xf7ed59, 0.85, 'center');
      this.text('COMBO', FIELD_WIDTH / 2, 62, 2, 0xf7ed59, 0.4, 'center');
    }
    // Live power-up timers along the bottom rail.
    let slot = 0;
    for (const kind of ['wide', 'slow'] as const) {
      const until = kind === 'wide' ? this.wideUntil : this.slowUntil;
      if (!until) continue;
      const power = POWERS[kind], left = 26 + slot * 118, y = height - 34;
      const remaining = Phaser.Math.Clamp((until - this.clock) / power.seconds, 0, 1);
      g.fillStyle(0x090715, 0.75); g.fillRect(left, y, 104, 16);
      g.fillStyle(power.color, 0.28); g.fillRect(left, y, 104 * remaining, 16);
      g.lineStyle(1, power.color, 0.5); g.strokeRect(left, y, 104, 16);
      this.text(power.label, left + 8, y + 5, 2, power.color, 0.95);
      slot++;
    }
    if (this.flash > 0) { g.fillStyle(0xffffff, this.flash * 0.07); g.fillRect(0, 0, FIELD_WIDTH, height); }
    if (this.damage > 0) {
      g.fillStyle(0xef4db8, this.damage * 0.16); g.fillRect(0, 0, FIELD_WIDTH, height);
      g.lineStyle(6, 0xef4db8, this.damage * 0.6); g.strokeRect(3, 3, FIELD_WIDTH - 6, height - 6);
    }
    if (this.status === 'won' && this.victory > 0) {
      g.fillStyle(0x58e6cf, this.victory * 0.1); g.fillRect(0, 0, FIELD_WIDTH, height);
      this.text('CIRCUIT CLEARED', FIELD_WIDTH / 2, height / 2 - 30, 5, 0xf7ed59, this.victory, 'center');
    }
    // A soft CRT vignette drawn as nested frames, darkest at the very edge.
    for (let i = 0; i < 9; i++) {
      const inset = i * 3;
      g.fillStyle(0x05030d, 0.055 * (1 - i / 9));
      g.fillRect(inset, inset, FIELD_WIDTH - inset * 2, 3);
      g.fillRect(inset, height - inset - 3, FIELD_WIDTH - inset * 2, 3);
      g.fillRect(inset, inset, 3, height - inset * 2);
      g.fillRect(FIELD_WIDTH - inset - 3, inset, 3, height - inset * 2);
    }
  }
}
export const mount: MountGame = (parent, onChange) => {
  const scene = new CircuitBreakScene(onChange);
  const height = Math.max(560, Math.round(800 * parent.clientHeight / Math.max(1, parent.clientWidth)));
  scene.resizeField(height);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: 800, height, backgroundColor: '#120e26', scene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: false }, audio: { noAudio: true } });
  const resize = () => {
    if (!parent.clientWidth || !parent.clientHeight) return;
    const height = Math.max(560, Math.round(800 * parent.clientHeight / parent.clientWidth));
    if (height !== scene.fieldHeight) { scene.resizeField(height); game.scale.setGameSize(800, height); }
  };
  const observer = new ResizeObserver(resize); observer.observe(parent);
  game.events.once(Phaser.Core.Events.READY, resize);
  return { start: () => scene.start(), pause: () => scene.pause(), restart: () => scene.restart(), controlPosition: position => scene.movePaddle(position), destroy: () => { observer.disconnect(); game.events.off(Phaser.Core.Events.READY, resize); game.destroy(true); } };
};
