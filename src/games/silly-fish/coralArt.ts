import type Phaser from 'phaser';
import type { CoralPair } from './model';

const palettes = [
  { base: 0xc34d91, tip: 0xffa2c7, shade: 0x79355f },
  { base: 0xe77e63, tip: 0xffce93, shade: 0x93465e },
  { base: 0x39b7ae, tip: 0x9cf1d5, shade: 0x286a80 },
  { base: 0x9670ce, tip: 0xd7b4ff, shade: 0x574880 },
];

export function drawCoral(g: Phaser.GameObjects.Graphics, pair: CoralPair, rectangles: { x: number; y: number; width: number; height: number }[]) {
  const seed = Math.floor(pair.center * 7 + pair.gap * 3);
  rectangles.forEach((rect, index) => {
    const bottom = rect.y > pair.center;
    const palette = palettes[(seed + (bottom ? 2 : 0)) % palettes.length];
    g.fillStyle(palette.shade);
    g.fillEllipse(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height);
    g.fillStyle(palette.base);
    g.fillEllipse(rect.x + rect.width * 0.43, rect.y + rect.height / 2, rect.width * 0.82, rect.height);
    // Small pale polyps and irregular ridges give the branches a living texture.
    if (index % 3 === 0) {
      g.fillStyle(palette.tip, 0.65);
      g.fillCircle(rect.x + rect.width * 0.32, rect.y + rect.height * 0.4, 1.5);
      g.fillStyle(palette.shade, 0.5);
      g.fillCircle(rect.x + rect.width * 0.65, rect.y + rect.height * 0.65, 1.2);
    }
  });
}
