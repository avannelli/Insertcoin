import type Phaser from 'phaser';
import { TABLE_WIDTH, TABLE_HEIGHT, WALL, GOAL_HALF } from './model';

const LEFT = WALL, RIGHT = TABLE_WIDTH - WALL, TOP = WALL, BOTTOM = TABLE_HEIGHT - WALL;
const ICE_W = RIGHT - LEFT, ICE_H = BOTTOM - TOP;

// Deterministic noise: the surface must look worn, never flicker between frames.
function seeded(seed: number) {
  let state = seed;
  return () => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
}

// Sheet of ice: cold base, polished bloom under the lights, then wear on top.
function drawIce(g: Phaser.GameObjects.Graphics) {
  g.fillGradientStyle(0xdde8f1, 0xeef5fa, 0xe7f0f7, 0xd6e2ec, 1);
  g.fillRect(LEFT, TOP, ICE_W, ICE_H);

  // Thickness at the boards: the sheet reads colder and deeper where it meets the dashers.
  for (let i = 0; i < 38; i++) {
    const inset = i * 1.7, alpha = 0.03 * (1 - i / 38);
    g.lineStyle(2.4, 0x557fa8, alpha);
    g.strokeRect(LEFT + inset, TOP + inset, ICE_W - inset * 2, ICE_H - inset * 2);
  }
  // Corners sit furthest from the lamps and read coldest.
  for (const [cx, cy] of [[LEFT, TOP], [RIGHT, TOP], [LEFT, BOTTOM], [RIGHT, BOTTOM]] as const) {
    for (let ring = 5; ring >= 1; ring--) { g.fillStyle(0x5d84ad, 0.025); g.fillEllipse(cx, cy, 60 * ring, 60 * ring); }
  }

  // Overhead lamp pools reflected in the polish.
  const pools: [number, number, number, number, number][] = [
    [150, 165, 350, 270, 0.5], [330, 300, 310, 250, 0.36],
    [140, 520, 330, 270, 0.4], [320, 655, 300, 230, 0.34],
  ];
  for (const [x, y, w, h, peak] of pools) {
    for (let ring = 6; ring >= 1; ring--) {
      g.fillStyle(0xffffff, (peak / 6) * (1 - ring / 7) * 1.4);
      g.fillEllipse(x, y, (w * ring) / 6, (h * ring) / 6);
    }
  }

  // A long specular streak, the way a resurfaced sheet catches light on the diagonal.
  g.fillStyle(0xffffff, 0.11);
  g.fillPoints([
    { x: LEFT, y: 250 }, { x: RIGHT, y: 60 }, { x: RIGHT, y: 110 }, { x: LEFT, y: 315 },
  ] as Phaser.Types.Math.Vector2Like[], true);
  g.fillStyle(0xffffff, 0.07);
  g.fillPoints([
    { x: LEFT, y: 520 }, { x: RIGHT, y: 400 }, { x: RIGHT, y: 470 }, { x: LEFT, y: 600 },
  ] as Phaser.Types.Math.Vector2Like[], true);

  // Cool cast where the light falls off, so the sheet is not uniformly bright.
  g.fillStyle(0x9cb9d4, 0.1);
  g.fillEllipse(TABLE_WIDTH / 2, 360, ICE_W * 1.35, 210);
}

// Skate wear: fine cuts, long carved arcs and scraped snow, all fixed by the seed.
function drawWear(g: Phaser.GameObjects.Graphics) {
  const random = seeded(20260910);
  for (let i = 0; i < 320; i++) {
    const x = LEFT + random() * ICE_W, y = TOP + random() * ICE_H;
    const angle = (random() - 0.5) * 1.1 + (random() < 0.3 ? Math.PI / 2 : 0);
    const length = 5 + random() * 34;
    const bright = random() < 0.62;
    g.lineStyle(bright ? 1 : 1.5, bright ? 0xffffff : 0x84a0ba, bright ? 0.5 : 0.17);
    g.lineBetween(x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length);
  }
  // Carved turns from earlier skaters.
  for (let i = 0; i < 22; i++) {
    const x = LEFT + random() * ICE_W, y = TOP + random() * ICE_H;
    const radius = 40 + random() * 150, from = random() * Math.PI * 2;
    g.lineStyle(1.2, 0xffffff, 0.3);
    g.beginPath(); g.arc(x, y, radius, from, from + 0.35 + random() * 0.5, false); g.strokePath();
  }
  // Snow shavings pile up where players stop: the creases and the corners.
  for (let i = 0; i < 90; i++) {
    const corner = i % 4;
    const cx = corner % 2 ? RIGHT - 40 : LEFT + 40, cy = corner < 2 ? TOP + 60 : BOTTOM - 60;
    const x = cx + (random() - 0.5) * 120, y = cy + (random() - 0.5) * 130;
    g.fillStyle(0xffffff, 0.16 + random() * 0.2);
    g.fillEllipse(x, y, 3 + random() * 9, 2 + random() * 4);
  }
  for (let i = 0; i < 70; i++) {
    const mouth = i % 2 ? BOTTOM - 46 : TOP + 46;
    const x = TABLE_WIDTH / 2 + (random() - 0.5) * 190, y = mouth + (random() - 0.5) * 58;
    g.fillStyle(0xffffff, 0.2 + random() * 0.25);
    g.fillEllipse(x, y, 4 + random() * 11, 2 + random() * 4);
  }
}

// Paint lives under the ice, so every line is slightly veiled.
function drawMarkings(g: Phaser.GameObjects.Graphics) {
  const red = 0xc2384c, blue = 0x2f6cb0;
  g.lineStyle(7, blue, 0.62);
  g.lineBetween(LEFT, 245, RIGHT, 245); g.lineBetween(LEFT, 475, RIGHT, 475);
  g.lineStyle(4, red, 0.66); g.lineBetween(LEFT, 360, RIGHT, 360);
  g.lineStyle(2, blue, 0.66); g.strokeCircle(240, 360, 60);
  g.fillStyle(blue, 0.75); g.fillCircle(240, 360, 4);
  for (const y of [150, 570]) for (const x of [120, 360]) {
    g.lineStyle(1.7, red, 0.5); g.strokeCircle(x, y, 44);
    g.fillStyle(red, 0.6); g.fillCircle(x, y, 3.5);
    for (const side of [-1, 1]) {
      g.lineBetween(x - 8, y + side * 9, x - 8, y + side * 17);
      g.lineBetween(x + 8, y + side * 9, x + 8, y + side * 17);
    }
  }
  for (const y of [275, 445]) for (const x of [120, 360]) { g.fillStyle(red, 0.55); g.fillCircle(x, y, 3); }
  for (const lower of [false, true]) {
    const y = lower ? BOTTOM : TOP;
    g.fillStyle(0x7fc0e0, 0.34);
    g.slice(240, y, 76, lower ? Math.PI : 0, lower ? Math.PI * 2 : Math.PI, false); g.fillPath();
    g.lineStyle(2, red, 0.6);
    g.beginPath(); g.arc(240, y, 76, lower ? Math.PI : 0, lower ? Math.PI * 2 : Math.PI, false); g.strokePath();
    g.lineStyle(4, red, 0.6); g.lineBetween(LEFT, y, RIGHT, y);
  }
}

// A last pass of gloss so the paint sits beneath the surface, not printed on it.
function drawGloss(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0xffffff, 0.07);
  g.fillPoints([
    { x: LEFT, y: 120 }, { x: RIGHT, y: 20 }, { x: RIGHT, y: 52 }, { x: LEFT, y: 168 },
  ] as Phaser.Types.Math.Vector2Like[], true);
  g.fillStyle(0xeaf6ff, 0.05);
  g.fillEllipse(210, 300, 360, 420);
  g.fillStyle(0x5d82a8, 0.03);
  g.fillEllipse(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, ICE_W * 1.6, ICE_H * 1.5);
}

// Dasher boards, goal mouths and the netting behind them.
function drawBoards(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x1b2434); g.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  g.fillStyle(0x263244); g.fillRect(0, 0, TABLE_WIDTH, TOP); g.fillRect(0, BOTTOM, TABLE_WIDTH, TOP);
  g.fillStyle(0x2c3950); g.fillRect(0, 0, LEFT, TABLE_HEIGHT); g.fillRect(RIGHT, 0, LEFT, TABLE_HEIGHT);
  // Kickplate: a bright lip of board catching the same overhead light.
  g.fillStyle(0xe9eef4, 0.82); g.fillRect(LEFT - 5, TOP - 5, 5, ICE_H + 10); g.fillRect(RIGHT, TOP - 5, 5, ICE_H + 10);
  g.fillStyle(0xe9eef4, 0.5); g.fillRect(LEFT - 5, TOP - 5, ICE_W + 10, 5); g.fillRect(LEFT - 5, BOTTOM, ICE_W + 10, 5);
  g.fillStyle(0x8fa2b8, 0.45); g.fillRect(LEFT - 5, TOP - 5, 2, ICE_H + 10); g.fillRect(RIGHT + 3, TOP - 5, 2, ICE_H + 10);
  for (const lower of [false, true]) {
    const y = lower ? BOTTOM : TOP;
    g.fillStyle(0x0c111b); g.fillRect(240 - GOAL_HALF, lower ? y + 2 : 0, GOAL_HALF * 2, 16);
    g.lineStyle(1, 0x7a8899, 0.5);
    for (let x = 240 - GOAL_HALF + 8; x < 240 + GOAL_HALF; x += 10) g.lineBetween(x, lower ? y + 4 : 2, x, lower ? y + 14 : 14);
    g.fillStyle(0xc2384c); g.fillRect(240 - GOAL_HALF - 3, y - 3, 6, 6); g.fillRect(240 + GOAL_HALF - 3, y - 3, 6, 6);
  }
}

// Static surface, drawn once beneath the moving pieces.
export function drawRink(g: Phaser.GameObjects.Graphics) {
  drawBoards(g);
  drawIce(g);
  drawWear(g);
  drawMarkings(g);
  drawGloss(g);
}
