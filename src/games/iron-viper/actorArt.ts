import type Phaser from 'phaser';
import type { Enemy } from './entities';
import type { Player } from './player';
type Graphics = Phaser.GameObjects.Graphics;
export const ink = 0x0a1222, cyan = 0x58e6d5, pink = 0xef4bba, gold = 0xffd865;
export function scout(g: Graphics, x: number, y: number, time: number, occupied = false) {
  g.fillStyle(ink); g.fillRoundedRect(x - 48, y - 20, 96, 24, 10);
  for (let i = 0; i < 5; i++) {
    g.fillStyle(0x485666); g.fillCircle(x - 34 + i * 17, y - 8, 8);
    g.fillStyle(0x839bab); g.fillRect(x - 37 + i * 17, y - 10 + Math.sin(time * 14 + i) * 2, 6, 3);
  }
  g.fillStyle(0x476b75); g.fillPoints([{ x: x - 43, y: y - 23 }, { x: x - 29, y: y - 42 }, { x: x + 26, y: y - 42 }, { x: x + 46, y: y - 23 }], true);
  g.fillStyle(0x729e9d); g.fillRect(x - 22, y - 43, 42, 6);
  g.fillStyle(ink); g.fillRect(x - 18, y - 39, 22, 11);
  g.fillStyle(cyan); g.fillRect(x + 30, y - 28, 12, 6); g.fillRect(x - 16, y - 37, 16, 3);
  g.fillStyle(0x293e53); g.fillRect(x + 2, y - 45, 52, 9);
  g.fillStyle(0xafb9ae); g.fillRect(x + 46, y - 46, 9, 12);
  g.fillStyle(gold); g.fillRect(x - 36, y - 26, 9, 7);
  if (occupied) { g.fillStyle(pink); g.fillRect(x - 6, y - 54, 15, 12); g.fillStyle(cyan); g.fillRect(x + 1, y - 51, 10, 4); }
}
/** Original pixel silhouette: swept scarf, cyan visor, asymmetrical shoulder armor. */
export function hero(g: Graphics, p: Player, camera: number, time: number, aimUp: boolean, dying: boolean) {
  const x = Math.round(p.x - camera), y = Math.round(p.y);
  if (time > 0 && p.invulnerable > 0 && Math.floor(time * 15) % 2 === 0 && !dying) return;
  if (p.vehicle) { scout(g, x, y, time, true); g.setAlpha(1); return; }
  const crouch = p.crouching ? 16 : 0, f = p.facing;
  const step = p.grounded ? Math.sin(time * 19) * Math.min(8, Math.abs(p.vx) / 25) : 7;
  const r = (dx: number, dy: number, w: number, h: number, color: number) => { g.fillStyle(color); g.fillRect(Math.round(x + (f > 0 ? dx : -dx - w)), y + dy + crouch + (dying ? 18 : 0), w, h); };
  // Broad dark outline holds the figure against bright machinery.
  r(-14, -45, 27, 29, ink); r(-10, -59, 25, 19, ink);
  r(-12, -38, 21, 20, 0x488586); r(-13, -42, 12, 10, 0x71c2b6);
  r(-8, -56, 20, 16, 0xddd0ad); r(-10, -59, 23, 8, 0x263647);
  r(1, -52, 15, 5, cyan); r(-14, -45, 22, 6, pink);
  g.fillStyle(pink); g.fillTriangle(x - f * 8, y - 44 + crouch, x - f * 34, y - 40 + crouch + Math.sin(time * 12) * 3, x - f * 18, y - 49 + crouch);
  if (!p.crouching) {
    r(-10 - step * 0.5, -20, 10, dying ? 9 : 17, 0x26364c); r(1 + step * 0.5, -20, 10, dying ? 8 : 17, 0x536275);
    r(-12 - step * 0.5, -5, 15, 5, ink); r(0 + step * 0.5, -5, 17, 5, ink);
  } else { r(-14, -20, 28, 5, 0x26364c); r(-14, -16, 32, 4, ink); }
  r(-9, -22, 21, 5, gold);
  if (aimUp) {
    r(7, -54, 7, 22, 0xd7c1a1); r(8, -74, 8, 29, 0x1c2e43); r(10, -74, 4, 12, cyan);
    if (p.muzzle > 0) { r(5, -85, 14, 9, gold); r(9, -90, 6, 17, 0xfff3c1); }
  } else {
    r(2, -35, 24, 7, 0xc5b494); r(12, -38, 25, 8, 0x1c2e43); r(21, -37, 15, 3, p.weapon === 'pulse' ? cyan : gold);
    if (p.muzzle > 0) { r(37, -42, 17, 15, gold); r(40, -38, 23, 7, 0xfff4c7); }
  }
  g.setAlpha(1);
}
export function enemyArt(g: Graphics, e: Enemy, camera: number, time: number) {
  const x = Math.round(e.x - camera), y = Math.round(e.y), heavy = e.kind === 'armor';
  if (e.kind === 'elevated') {
    g.fillStyle(0x2d4054); g.fillRect(x - 31, y, 62, 9); g.fillRect(x - 26, y + 9, 6, 442 - y); g.fillRect(x + 20, y + 9, 6, 442 - y);
    g.lineStyle(2, 0x62728a); g.lineBetween(x - 24, y + 12, x + 24, 440);
  }
  if (e.spawn > 0) {
    g.lineStyle(2, pink, 0.6); g.strokeRect(x - 25, y - 60, 50, 60);
    g.fillStyle(pink); g.fillTriangle(x - 8, y - 73, x + 8, y - 73, x, y - 63); return;
  }
  const color = e.hit > 0 ? 0xffffff : heavy ? 0x928186 : e.kind === 'rusher' ? 0xd57a69 : 0x7d79a4;
  if (e.kind === 'drone') {
    g.fillStyle(ink); g.fillEllipse(x, y, 50, 24); g.fillStyle(color); g.fillRect(x - 17, y - 10, 34, 17);
    g.fillStyle(pink); g.fillRect(x - 4, y - 5, 8, 6);
    g.lineStyle(3, cyan, 0.5 + Math.sin(time * 30) * 0.3); g.lineBetween(x - 32, y - 11, x - 15, y - 11); g.lineBetween(x + 15, y - 11, x + 32, y - 11);
    g.fillStyle(0x424965); g.fillRect(x - 3, y + 6, 7, 9);
  } else {
    const width = heavy ? 37 : 25, h = heavy ? 48 : 43;
    g.fillStyle(ink); g.fillRect(x - width / 2 - 3, y - h - 10, width + 6, h + 10);
    g.fillStyle(color); g.fillRect(x - width / 2, y - h, width, h - 17);
    g.fillStyle(heavy ? 0xb3a79f : 0xaca0ad); g.fillRect(x - 10, y - h - 8, 20, 16);
    g.fillStyle(ink); g.fillRect(x - 12, y - h - 10, 24, 7);
    g.fillStyle(pink); g.fillRect(x - 10, y - h - 1, 20, 4);
    const step = Math.sin(time * (e.kind === 'rusher' ? 20 : 7) + e.x) * 4;
    g.fillStyle(0x394058); g.fillRect(x - 11, y - 17, 9, 15 + step); g.fillRect(x + 3, y - 17, 9, 15 - step);
    g.fillStyle(ink); g.fillRect(x + e.facing * 10 - (e.facing < 0 ? 20 : 0), y - 31, heavy ? 32 : 25, 8);
    if (e.kind === 'rusher') { g.fillStyle(gold); g.fillRect(x + e.facing * 22, y - 38, 5, 24); }
    if (heavy) { g.fillStyle(gold); g.fillRect(x - 14, y - 35, 8, 13); }
  }
  if (e.warning > 0) { g.fillStyle(gold); g.fillRect(x - 3, y - (e.kind === 'drone' ? 33 : 77), 6, 13); g.fillRect(x - 3, y - (e.kind === 'drone' ? 16 : 60), 6, 4); }
  if (e.hp < e.maxHp) { g.fillStyle(ink); g.fillRect(x - 19, y - 67, 38, 4); g.fillStyle(pink); g.fillRect(x - 19, y - 67, 38 * Math.max(0, e.hp / e.maxHp), 4); }
}
