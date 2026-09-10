import type Phaser from 'phaser';
import { TABLE_WIDTH, TABLE_HEIGHT, WALL, GOAL_HALF } from './model';

// Static surface, drawn once beneath the moving pieces.
export function drawRink(g: Phaser.GameObjects.Graphics) {
  const red = 0xc83f53, blue = 0x3675b5;
  g.fillStyle(0x263044); g.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  g.fillGradientStyle(0xe2eef3, 0xf6fafb, 0xeaf4f7, 0xdceaf0, 1);
  g.fillRect(WALL, WALL, TABLE_WIDTH - WALL * 2, TABLE_HEIGHT - WALL * 2);
  // Fixed, low-contrast skate scratches and frosted patches never flicker.
  for (let i = 0; i < 150; i++) {
    const x = 28 + (i * 137) % 405, y = 28 + (i * 83) % 650;
    g.lineStyle(1, i % 3 === 0 ? 0x7f9eaf : 0xffffff, i % 3 === 0 ? 0.09 : 0.5);
    g.lineBetween(x, y, Math.min(451, x + 8 + i % 23), Math.min(691, y + 3 + i % 11));
  }
  g.lineStyle(7, blue, 0.85);
  g.lineBetween(18, 245, 462, 245); g.lineBetween(18, 475, 462, 475);
  g.lineStyle(4, red, 0.9); g.lineBetween(18, 360, 462, 360);
  g.lineStyle(2, blue, 0.9); g.strokeCircle(240, 360, 60);
  g.fillStyle(blue); g.fillCircle(240, 360, 4);
  // Red end-zone faceoff circles and neutral-zone faceoff spots.
  for (const y of [150, 570]) for (const x of [120, 360]) {
    g.lineStyle(1.7, red, 0.7); g.strokeCircle(x, y, 44);
    g.fillStyle(red); g.fillCircle(x, y, 3.5);
    for (const side of [-1, 1]) {
      g.lineBetween(x - 8, y + side * 9, x - 8, y + side * 17);
      g.lineBetween(x + 8, y + side * 9, x + 8, y + side * 17);
    }
  }
  for (const y of [275, 445]) for (const x of [120, 360]) { g.fillStyle(red); g.fillCircle(x, y, 3); }
  for (const lower of [false, true]) {
    const y = lower ? 702 : 18;
    // Blue goal crease, red outline. Goal mouths retain their physics dimensions.
    g.fillStyle(0x8cc9e4, 0.48);
    g.slice(240, y, 76, lower ? Math.PI : 0, lower ? Math.PI * 2 : Math.PI, false); g.fillPath();
    g.lineStyle(2, red, 0.85);
    g.beginPath(); g.arc(240, y, 76, lower ? Math.PI : 0, lower ? Math.PI * 2 : Math.PI, false); g.strokePath();
    g.lineBetween(18, y, 462, y);
    g.fillStyle(0x101621); g.fillRect(240 - GOAL_HALF, lower ? 704 : 0, GOAL_HALF * 2, 16);
    g.lineStyle(1, 0x72808b, 0.5);
    for (let x = 240 - GOAL_HALF + 8; x < 240 + GOAL_HALF; x += 10) g.lineBetween(x, lower ? 706 : 2, x, lower ? 718 : 14);
    g.lineStyle(4, 0xe6ebef);
    g.lineBetween(18, y, 240 - GOAL_HALF, y); g.lineBetween(240 + GOAL_HALF, y, 462, y);
    g.fillStyle(red); g.fillCircle(240 - GOAL_HALF, y, 4); g.fillCircle(240 + GOAL_HALF, y, 4);
  }
  g.lineStyle(6, 0xffffff, 0.65); g.lineBetween(18, 20, 18, 700); g.lineBetween(462, 20, 462, 700);
  g.lineStyle(2, 0x697d90, 0.75); g.lineBetween(21, 20, 21, 700); g.lineBetween(459, 20, 459, 700);
}
