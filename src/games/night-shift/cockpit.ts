import type Phaser from 'phaser';
import type { NightRace } from './model';
export function drawCockpit(g: Phaser.GameObjects.Graphics, race: NightRace, steering: number, reducedMotion: boolean) {
  const shake = !reducedMotion && race.disruption > 0 ? Math.sin(race.elapsed * 75) * 3 : 0;
  g.fillStyle(0x080c15); g.fillPoints([{ x: 0, y: 416 }, { x: 110, y: 433 }, { x: 690, y: 433 }, { x: 800, y: 416 }, { x: 800, y: 560 }, { x: 0, y: 560 }], true);
  g.lineStyle(2, 0x566477); g.lineBetween(110, 433, 690, 433);
  g.fillStyle(0x121b29); g.fillRoundedRect(65, 450, 200, 85, 8); g.fillRoundedRect(535, 450, 200, 85, 8);
  g.lineStyle(1, 0x58e6cf, 0.6); g.strokeRoundedRect(65, 450, 200, 85, 8); g.strokeRoundedRect(535, 450, 200, 85, 8);
  for (let i = 0; i < 18; i++) { g.fillStyle(i < race.player.speed / 85 * 18 ? (i > 14 ? 0xef4db8 : 0x58e6cf) : 0x263241); g.fillRect(79 + i * 9.5, 520, 6, 4); }
  const x = 400 + shake, y = 523, a = steering * 0.32;
  g.lineStyle(17, 0x03070c); g.strokeCircle(x, y, 68);
  g.lineStyle(3, 0x596575); g.strokeCircle(x, y, 69);
  g.lineStyle(12, 0x242c3b);
  for (const angle of [a, Math.PI + a, Math.PI / 2 + a]) g.lineBetween(x, y, x + Math.cos(angle) * 60, y + Math.sin(angle) * 60);
  g.fillStyle(0x101825); g.fillCircle(x, y, 25); g.lineStyle(1, 0xef4db8); g.strokeCircle(x, y, 24);
  g.fillStyle(0x58e6cf); g.fillRect(x - 8, y - 4, 16, 8);
  if (race.disruption > 0 && !reducedMotion) { g.lineStyle(2, 0xf7dc73, 0.7); for (let i = 0; i < 5; i++) g.lineBetween(20 + i * 23, 420, 12 + i * 23, 410 - (i % 3) * 6); }
}
