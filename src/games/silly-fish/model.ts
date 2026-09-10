export const WIDTH = 800;
export const HEIGHT = 560;
export const FISH_X = 200;
export const RADIUS_X = 17;
export const RADIUS_Y = 12;
export interface CoralPair { x: number; center: number; gap: number; passed: boolean; }
export interface CoralRect { x: number; y: number; width: number; height: number; }
export const difficulty = (score: number) => ({ speed: Math.min(230, 155 + score * 2.5), gap: Math.max(174, 216 - score * 1.4) });

// These same shapes drive rendering and collision. Branches never intrude into the gap.
export function coralRects(pair: CoralPair): CoralRect[] {
  const top = pair.center - pair.gap / 2, bottom = pair.center + pair.gap / 2;
  const shapes: CoralRect[] = [];
  for (const lower of [false, true]) {
    const height = lower ? HEIGHT - bottom : top;
    // Tapered, curved fingers grow from a shared root; every tip stays outside the safe gap.
    for (let branch = 0; branch < 5; branch++) {
      const length = height - [0, 30, 50, 66, 83][branch];
      if (length < 12) continue;
      const destination = [37, 12, 62, 23, 51][branch];
      const count = Math.ceil(length / 6);
      for (let step = 0; step <= count; step++) {
        const t = step / count;
        const width = (branch === 0 ? 31 : 20) * (1 - t * 0.55);
        const cx = 37 + (destination - 37) * Math.sin(t * Math.PI / 2) + Math.sin(t * 8 + branch) * 2;
        const depth = Math.min(length - 6, t * length);
        const cy = lower ? HEIGHT - depth : depth;
        shapes.push({ x: pair.x + cx - width / 2, y: cy - 6, width, height: 12 });
      }
    }
  }
  return shapes;
}
export function intersectsCoral(y: number, rectangle: CoralRect) {
  const nearX = Math.max(rectangle.x, Math.min(FISH_X, rectangle.x + rectangle.width));
  const nearY = Math.max(rectangle.y, Math.min(y, rectangle.y + rectangle.height));
  return ((FISH_X - nearX) / RADIUS_X) ** 2 + ((y - nearY) / RADIUS_Y) ** 2 <= 1;
}

export class FishRun {
  y = HEIGHT / 2;
  velocity = 0;
  score = 0;
  alive = true;
  distance = 0;
  pairs: CoralPair[] = [];
  constructor(private random: () => number = Math.random) { this.spawn(650, HEIGHT / 2); }
  swim() { if (this.alive) this.velocity = -285; }
  private spawn(x: number, previousCenter: number) {
    const center = Math.max(155, Math.min(405, previousCenter + (this.random() - 0.5) * 150));
    this.pairs.push({ x, center, gap: difficulty(this.score).gap, passed: false });
  }
  step(dt: number): 'score' | 'over' | undefined {
    if (!this.alive) return;
    const speed = difficulty(this.score).speed;
    this.velocity = Math.min(420, this.velocity + 850 * dt);
    this.y += this.velocity * dt;
    this.distance += speed * dt;
    this.pairs.forEach(pair => { pair.x -= speed * dt; });
    if (this.y - RADIUS_Y <= 0 || this.y + RADIUS_Y >= HEIGHT || this.pairs.some(pair => pair.x < FISH_X + RADIUS_X && pair.x + 74 > FISH_X - RADIUS_X && coralRects(pair).some(rect => intersectsCoral(this.y, rect)))) {
      this.alive = false; return 'over';
    }
    let event: 'score' | undefined;
    for (const pair of this.pairs) {
      if (!pair.passed && pair.x + 74 < FISH_X - RADIUS_X) { pair.passed = true; this.score++; event = 'score'; }
    }
    const last = this.pairs[this.pairs.length - 1];
    if (last.x <= WIDTH - 285) this.spawn(last.x + 285, last.center);
    this.pairs = this.pairs.filter(pair => pair.x > -90);
    return event;
  }
}
