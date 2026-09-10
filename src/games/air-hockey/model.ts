export const TABLE_WIDTH = 480;
export const TABLE_HEIGHT = 720;
export const WALL = 18;
export const GOAL_HALF = 78;
export const PUCK_RADIUS = 11;
export const PADDLE_RADIUS = 26;
export const MAX_PUCK_SPEED = 1050;
export type Phase = 'ready' | 'countdown' | 'playing' | 'goal' | 'paused' | 'won' | 'over';
export type HockeyEvent = 'paddle' | 'wall' | 'goal' | 'countdown' | 'go' | 'win' | 'loss';
interface Body { x: number; y: number; vx: number; vy: number; }
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export class HockeyMatch {
  puck: Body = { x: 240, y: 360, vx: 0, vy: 0 };
  player: Body = { x: 240, y: 600, vx: 0, vy: 0 };
  cpu: Body = { x: 240, y: 120, vx: 0, vy: 0 };
  target = { x: 240, y: 600 };
  playerScore = 0;
  cpuScore = 0;
  phase: Phase = 'ready';
  remaining = 0;
  goalBy: 'player' | 'cpu' = 'player';
  events: HockeyEvent[] = [];
  private resumePhase: Phase = 'playing';
  private cpuTarget = { x: 240, y: 120 };
  private reaction = 0;
  private slowTime = 0;
  private serve = 1;
  constructor(private random: () => number = Math.random) {}

  start() { if (this.phase === 'ready') this.faceoff(); else if (this.phase === 'paused') this.pause(); }
  pause() {
    if (this.phase === 'paused') this.phase = this.resumePhase;
    else if (['playing', 'countdown', 'goal'].includes(this.phase)) { this.resumePhase = this.phase; this.phase = 'paused'; }
  }
  private faceoff() {
    this.player = { x: 240, y: 600, vx: 0, vy: 0 }; this.cpu = { x: 240, y: 120, vx: 0, vy: 0 };
    this.target = { x: 240, y: 600 }; this.cpuTarget = { x: 240, y: 120 };
    this.puck = { x: 240, y: 360, vx: 0, vy: 0 };
    this.reaction = 0; this.slowTime = 0; this.remaining = 1.25; this.phase = 'countdown'; this.events.push('countdown');
  }
  setTarget(x: number, y: number) {
    this.target.x = clamp(x, WALL + PADDLE_RADIUS + 2, TABLE_WIDTH - WALL - PADDLE_RADIUS - 2);
    this.target.y = clamp(y, TABLE_HEIGHT / 2 + PADDLE_RADIUS + 3, TABLE_HEIGHT - WALL - PADDLE_RADIUS - 8);
  }
  step(delta: number) {
    const dt = clamp(delta, 0, 0.05);
    if (this.phase === 'paused' || this.phase === 'ready' || this.phase === 'won' || this.phase === 'over') return;
    if (this.phase === 'goal' || this.phase === 'countdown') {
      this.remaining -= dt;
      if (this.remaining <= 0) {
        if (this.phase === 'goal') this.faceoff();
        else {
          this.phase = 'playing'; this.puck.vx = (this.random() - 0.5) * 170;
          this.puck.vy = 320 * this.serve; this.serve *= -1; this.events.push('go');
        }
      }
      return;
    }
    // At maximum combined paddle/puck speed, each substep moves < 4 pixels.
    const steps = Math.max(1, Math.ceil(dt / 0.002));
    for (let i = 0; i < steps && this.phase === 'playing'; i++) this.integrate(dt / steps);
  }
  private move(body: Body, target: { x: number; y: number }, speed: number, dt: number) {
    const dx = target.x - body.x, dy = target.y - body.y, distance = Math.hypot(dx, dy);
    const scale = distance > 0 ? Math.min(1, speed * dt / distance) : 0;
    body.vx = dt ? dx * scale / dt : 0; body.vy = dt ? dy * scale / dt : 0;
    body.x += dx * scale; body.y += dy * scale;
  }
  private think(dt: number) {
    this.reaction -= dt;
    if (this.reaction > 0) return;
    this.reaction = 0.13 + this.random() * 0.07;
    const puck = this.puck;
    const error = (this.random() - 0.5) * 40;
    if (puck.y < TABLE_HEIGHT / 2 + 45) {
      const time = puck.vy < -30 ? clamp((110 - puck.y) / puck.vy, 0, 0.45) : 0.10;
      let projected = puck.x + puck.vx * time;
      const left = WALL + PUCK_RADIUS, right = TABLE_WIDTH - left;
      // Predict one bank shot, then clamp. The CPU is deliberately imperfect.
      if (projected < left) projected = left + (left - projected);
      if (projected > right) projected = right - (projected - right);
      this.cpuTarget.x = projected + error;
      this.cpuTarget.y = puck.vy < -100 ? 105 : puck.y - 40;
    } else {
      this.cpuTarget.x = 240 + (puck.x - 240) * 0.38 + error;
      this.cpuTarget.y = 115;
    }
    this.cpuTarget.x = clamp(this.cpuTarget.x, 48, TABLE_WIDTH - 48);
    this.cpuTarget.y = clamp(this.cpuTarget.y, 56, TABLE_HEIGHT / 2 - PADDLE_RADIUS - 5);
  }
  private integrate(dt: number) {
    this.think(dt);
    this.move(this.player, this.target, 950, dt);
    this.move(this.cpu, this.cpuTarget, 285 + Math.min(50, Math.max(0, this.playerScore - this.cpuScore) * 12), dt);
    const p = this.puck;
    p.x += p.vx * dt; p.y += p.vy * dt;
    this.hitPaddle(this.player); this.hitPaddle(this.cpu);
    const left = WALL + PUCK_RADIUS, right = TABLE_WIDTH - left;
    if (p.x < left) { p.x = left; if (p.vx < 0) { p.vx *= -1; this.events.push('wall'); } }
    if (p.x > right) { p.x = right; if (p.vx > 0) { p.vx *= -1; this.events.push('wall'); } }
    const inGoal = Math.abs(p.x - TABLE_WIDTH / 2) < GOAL_HALF - PUCK_RADIUS;
    if (!inGoal) {
      if (p.y < WALL + PUCK_RADIUS) { p.y = WALL + PUCK_RADIUS; if (p.vy < 0) { p.vy *= -1; this.events.push('wall'); } }
      if (p.y > TABLE_HEIGHT - WALL - PUCK_RADIUS) { p.y = TABLE_HEIGHT - WALL - PUCK_RADIUS; if (p.vy > 0) { p.vy *= -1; this.events.push('wall'); } }
    }
    for (const paddle of [this.player, this.cpu]) {
      // A wall can cancel the normal separation above. Release a pinched puck along
      // the wall, toward open ice, instead of leaving it embedded in the paddle.
      const dx = p.x - paddle.x, dy = p.y - paddle.y, radius = PUCK_RADIUS + PADDLE_RADIUS;
      if (Math.hypot(dx, dy) < radius - 0.2 && (p.x <= left + 0.1 || p.x >= right - 0.1)) {
        const direction = paddle.y > 360 ? -1 : 1;
        p.y = paddle.y + direction * (Math.sqrt(Math.max(0, radius * radius - dx * dx)) + 0.2);
        p.vy = direction * Math.max(220, Math.abs(p.vy));
      } else if (Math.hypot(dx, dy) < radius - 0.2 && !inGoal && (p.y <= WALL + PUCK_RADIUS + 0.1 || p.y >= TABLE_HEIGHT - WALL - PUCK_RADIUS - 0.1)) {
        const direction = paddle.x < 240 ? 1 : -1;
        p.x = paddle.x + direction * (Math.sqrt(Math.max(0, radius * radius - dy * dy)) + 0.2);
        p.vx = direction * Math.max(220, Math.abs(p.vx));
      }
    }
    if (inGoal && p.y + PUCK_RADIUS < 0) this.goal('player');
    else if (inGoal && p.y - PUCK_RADIUS > TABLE_HEIGHT) this.goal('cpu');
    this.limitSpeed();
    // Release a nearly motionless puck rather than letting wall/paddle pinches stall a match.
    this.slowTime = Math.hypot(p.vx, p.vy) < 85 ? this.slowTime + dt : 0;
    if (this.slowTime > 1.2) { p.vx = p.x < 240 ? 160 : -160; p.vy = p.y < 360 ? 180 : -180; this.slowTime = 0; }
  }
  private hitPaddle(paddle: Body) {
    const p = this.puck, dx = p.x - paddle.x, dy = p.y - paddle.y, distance = Math.hypot(dx, dy);
    const radius = PUCK_RADIUS + PADDLE_RADIUS;
    if (distance >= radius) return;
    const nx = distance > 0.001 ? dx / distance : 0;
    const ny = distance > 0.001 ? dy / distance : (paddle.y > 360 ? -1 : 1);
    p.x = paddle.x + nx * (radius + 0.1); p.y = paddle.y + ny * (radius + 0.1);
    const approach = (p.vx - paddle.vx) * nx + (p.vy - paddle.vy) * ny;
    if (approach < 0) {
      p.vx -= 1.92 * approach * nx; p.vy -= 1.92 * approach * ny;
      // A moving paddle contributes momentum; stationary contact still has a crisp rebound.
      const away = p.vx * nx + p.vy * ny;
      if (away < 150) { p.vx += (150 - away) * nx; p.vy += (150 - away) * ny; }
      this.events.push('paddle'); this.limitSpeed();
    }
  }
  private limitSpeed() {
    const speed = Math.hypot(this.puck.vx, this.puck.vy);
    if (speed > MAX_PUCK_SPEED) { this.puck.vx *= MAX_PUCK_SPEED / speed; this.puck.vy *= MAX_PUCK_SPEED / speed; }
  }
  private goal(side: 'player' | 'cpu') {
    if (this.phase !== 'playing') return;
    this.goalBy = side;
    if (side === 'player') this.playerScore++; else this.cpuScore++;
    this.puck.vx = 0; this.puck.vy = 0;
    if (this.playerScore === 7 || this.cpuScore === 7) {
      this.phase = this.playerScore === 7 ? 'won' : 'over'; this.events.push(this.phase === 'won' ? 'win' : 'loss');
    } else { this.phase = 'goal'; this.remaining = 1.05; this.events.push('goal'); }
  }
}
