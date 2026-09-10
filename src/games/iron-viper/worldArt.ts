import type Phaser from 'phaser';
import { GROUND, WIDTH, HEIGHT } from './config';
import { platforms, pits } from './level';
import type { IronViperRun } from './model';
import { ink, cyan, pink, gold, scout } from './actorArt';
type Graphics = Phaser.GameObjects.Graphics;
export type Label = (x: number, y: number, text: string, size?: number, color?: string) => void;
export function background(g: Graphics, camera: number, time: number, sector: number) {
  g.fillGradientStyle(0x10182c, 0x251b3d, 0x3d284d, 0x152c3b, 1); g.fillRect(0, 0, WIDTH, HEIGHT);
  g.fillStyle(0xc5c4c9, 0.65); g.fillCircle(672 - camera * 0.008, 101, 25);
  g.fillStyle(0x27223c, 0.65); g.fillCircle(660 - camera * 0.008, 91, 26);
  for (let i = 0; i < 20; i++) {
    const x = ((i * 157 - camera * 0.14) % 1100 + 1100) % 1100 - 150, h = 65 + i * 31 % 110;
    g.fillStyle(0x172439); g.fillRect(x, GROUND - 110 - h, 90, h + 110);
    g.fillRect(x + 22, GROUND - 142 - h, 12, 34);
    g.fillStyle(pink, 0.55); g.fillRect(x + 26, GROUND - 144 - h, 4, 4);
    for (let j = 0; j < 3; j++) { g.fillStyle(0x80617c, 0.12); g.fillEllipse(x + 32 + j * 19 + Math.sin(time * 0.3 + i) * 8, GROUND - 162 - h - j * 15, 37 + j * 13, 20); }
    g.fillStyle(cyan, 0.2); for (let j = 0; j < 4; j++) g.fillRect(x + 12 + j * 18, GROUND - 100 - h, 5, 10);
  }
  g.fillStyle(cyan, 0.035); g.fillTriangle(210, 305, 330 + Math.sin(time * 0.2) * 40, 35, 490, 35);
  // Landmarks change the skyline between the street, depot, bridge and furnace.
  const landmark = 400 - ((camera * 0.3) % 230);
  if (sector === 2 || sector === 3) {
    g.lineStyle(8, 0x46536b); g.lineBetween(landmark, 290, landmark, 128); g.lineBetween(landmark - 160, 135, landmark + 290, 135);
    g.lineStyle(2, 0x627087); g.lineBetween(landmark, 96, landmark - 150, 135); g.lineBetween(landmark, 96, landmark + 280, 135); g.lineBetween(landmark + 180, 138, landmark + 180, 225);
    g.lineStyle(5, pink, 0.55); g.lineBetween(landmark - 160, 144, landmark + 285, 144);
    g.fillStyle(0x4a465d); g.fillRect(landmark + 132, 225, 96, 47); g.lineStyle(2, 0x716078); g.strokeRect(landmark + 135, 228, 90, 41);
  } else if (sector === 5) {
    g.fillStyle(0x342f46); g.fillRect(80, 128, 560, 53); g.fillStyle(0x60546a); g.fillRect(80, 134, 560, 9);
    for (let i = 0; i < 6; i++) { g.fillStyle(0x212b40); g.fillRect(110 + i * 95, 125, 12, 59); }
    g.fillStyle(0xffa25b, 0.4); g.fillRect(109, 150, 360, 4);
  } else if (sector === 1 || sector === 4) {
    g.lineStyle(5, 0x4c596f); g.strokeRect(landmark - 125, 158, 425, 180);
    g.fillStyle(0x212b40); g.fillRect(landmark - 130, 160, 435, 23);
    for (let i = 0; i < 8; i++) { g.fillStyle(i % 2 ? pink : cyan, 0.7); g.fillRect(landmark - 117 + i * 53, 169, 31, 3); }
  }
  for (let i = 0; i < 7; i++) {
    const x = ((i * 255 - camera * 0.52) % 1600 + 1600) % 1600 - 300;
    const y = 252 + i % 2 * 44;
    g.fillStyle(sector === 2 ? 0x384258 : 0x27354a); g.fillRect(x, y, 223, GROUND - y);
    g.fillStyle(0x536174); g.fillRect(x - 5, y, 233, 7);
    g.fillStyle(ink); g.fillRect(x + 18, y + 28, 83, 71); g.fillRect(x + 113, y + 28, 92, 71);
    g.lineStyle(3, 0x36475b); for (let j = 0; j < 5; j++) g.lineBetween(x + 20, y + 33 + j * 12, x + 201, y + 33 + j * 12);
    g.fillStyle(i % 2 ? pink : cyan, 0.8); g.fillRect(x + 26, y + 16, 70, 3);
    g.fillStyle(i % 2 ? pink : cyan, 0.035); g.fillTriangle(x + 26, y + 19, x - 16, GROUND, x + 146, GROUND);
    g.fillStyle(0x1c283b); g.fillRect(x + 216, y - 73, 8, GROUND - y + 73);
    g.lineStyle(3, 0x455769); g.lineBetween(x + 220, y - 72, x + 185, y - 72);
    g.fillStyle(gold); g.fillRect(x + 175, y - 73, 20, 4);
  }
  g.fillStyle(0x192337); g.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
  g.fillStyle(0x668080); g.fillRect(0, GROUND, WIDTH, 3);
  for (let i = 0; i < 32; i++) {
    const x = ((i * 71 - camera) % 950 + 950) % 950 - 80, y = GROUND + 18 + (i * 27 % 86);
    g.fillStyle(i % 3 ? cyan : pink, 0.1); g.fillRect(x, y, 23 + i * 7 % 70, 2);
    g.fillStyle(0x0d182b, 0.5); g.fillRect(x + 20, y + 7, 60, 3);
  }
  for (const pit of pits) {
    const x = pit.x - camera; if (x < -150 || x > WIDTH) continue;
    g.fillStyle(0x070d19); g.fillRect(x, GROUND, pit.width, HEIGHT - GROUND);
    g.fillStyle(pink, 0.18); g.fillRect(x + 9, HEIGHT - 40, pit.width - 18, 40);
    for (let j = 0; j < 3; j++) { g.fillStyle(gold); g.fillRect(x - 21 + j * 7, GROUND + 3, 4, 8); g.fillRect(x + pit.width + j * 7, GROUND + 3, 4, 8); }
  }
  for (const p of platforms) {
    const x = p.x - camera; if (x < -p.width || x > WIDTH) continue;
    g.fillStyle(0x657d89); g.fillRect(x, p.y, p.width, 5); g.fillStyle(0x29394f); g.fillRect(x, p.y + 5, p.width, 13);
    g.fillStyle(cyan); for (let j = 0; j < p.width; j += 42) g.fillRect(x + j, p.y + 5, 16, 3);
    g.lineStyle(4, 0x354a60); g.lineBetween(x + 15, p.y + 17, x + 40, GROUND); g.lineBetween(x + p.width - 15, p.y + 17, x + p.width - 40, GROUND);
  }
}
export function scenery(g: Graphics, run: IronViperRun, camera: number, label: Label) {
  for (const prop of run.props) {
    const x = prop.x - camera; if (!prop.alive || x < -60 || x > WIDTH + 60) continue;
    const y = prop.y;
    if (prop.kind === 'crate') {
      g.fillStyle(ink); g.fillRect(x - 25, y - 44, 50, 44); g.fillStyle(0x8b745f); g.fillRect(x - 22, y - 41, 44, 39);
      g.lineStyle(4, 0xc3a179); g.strokeRect(x - 19, y - 37, 38, 32); g.lineBetween(x - 18, y - 36, x + 18, y - 6);
      g.fillStyle(cyan); g.fillRect(x - 8, y - 30, 16, 14); label(x - 5, y - 29, '+', 13, '#102334');
    } else if (prop.kind === 'barrel') {
      g.fillStyle(ink); g.fillRoundedRect(x - 18, y - 44, 36, 44, 5); g.fillStyle(0x9d556e); g.fillRect(x - 15, y - 40, 30, 38);
      g.fillStyle(0xe7a47b); g.fillRect(x - 16, y - 36, 32, 4); g.fillRect(x - 16, y - 10, 32, 4); label(x - 6, y - 29, '!', 18, '#ffe07b');
    } else {
      g.fillStyle(0x506171); g.fillRect(x - 29, y - 34, 58, 28); g.fillStyle(ink); g.fillRect(x - 29, y - 4, 14, 4); g.fillRect(x + 15, y - 4, 14, 4);
      for (let i = 0; i < 5; i++) { g.fillStyle(i % 2 ? ink : gold); g.fillRect(x - 26 + i * 10, y - 30, 10, 8); }
    }
  }
  if (!run.vehicleClaimed) { const x = 7240 - camera; if (x > -70 && x < WIDTH + 70) { scout(g, x, GROUND, run.elapsed); label(x - 60, GROUND - 88, '↑ BOARD MANTIS', 14, '#58e6d5'); } }
  const gate = run.sector.end - 70 - camera;
  if (run.sectorIndex < 5 && gate > -50 && gate < WIDTH + 50) {
    g.fillStyle(0x45556b); g.fillRect(gate, 218, 12, GROUND - 218); g.fillRect(gate - 8, 215, 28, 9);
    g.fillStyle(run.cleared ? cyan : pink, 0.18); g.fillRect(gate - 4, 240, 20, GROUND - 240);
    label(gate - 127, 232, run.cleared ? 'CLEAR →' : 'CLEAR THE SECTOR', 13, run.cleared ? '#58e6d5' : '#ef4bba');
  }
}
export function bossArt(g: Graphics, run: IronViperRun, camera: number, label: Label) {
  const b = run.boss, x = b.x - camera, y = b.y; if (x > WIDTH + 160 || x < -160) return;
  const collapse = b.hp <= 0 ? Math.max(0, 2.5 - run.timer) * 13 : 0;
  g.fillStyle(ink); g.fillEllipse(x, y + 4, 230, 25);
  for (const side of [-1, 1]) {
    g.fillStyle(0x46556b); g.fillRect(x + side * 66 - 16, y - 80 + collapse, 32, 73 - collapse);
    g.fillStyle(0x8595a4); g.fillRect(x + side * 66 - 10, y - 50 + collapse, 11, 36 - collapse);
    g.fillStyle(0x26354b); g.fillRect(x + side * 67 - 34, y - 17, 68, 18);
    g.fillStyle(gold); g.fillRect(x + side * 67 - 23, y - 13, 15, 4);
  }
  g.fillStyle(0x152237); g.fillRoundedRect(x - 95, y - 160 + collapse, 186, 104, 12);
  g.fillStyle(0x60788a); g.fillRect(x - 86, y - 152 + collapse, 166, 60);
  g.fillStyle(0x829cab); g.fillRect(x - 76, y - 151 + collapse, 146, 7);
  g.fillStyle(0x34465f); g.fillRect(x - 44, y - 174 + collapse, 83, 25);
  g.fillStyle(b.warning > 0 ? gold : pink); g.fillRect(x - 34, y - 163 + collapse, 64, 5);
  for (let i = 0; i < 6; i++) { g.fillStyle(ink); g.fillRect(x + 16 + i * 9, y - 135 + collapse, 5, 30); }
  g.fillStyle(0x25364b); g.fillRect(x - 126, y - 115 + collapse, 86, 21); g.fillStyle(0x9ba7ad); g.fillRect(x - 128, y - 119 + collapse, 15, 28);
  g.fillStyle(0x28394e); g.fillCircle(x - 20, y - 48 + collapse, 42);
  g.lineStyle(6, b.exposed ? cyan : 0x667788); g.strokeCircle(x - 20, y - 48 + collapse, 27);
  g.fillStyle(b.hp <= 0 ? 0x202c3c : b.exposed ? 0xa4fff1 : 0x405868); g.fillRect(x - 34, y - 63 + collapse, 28, 28);
  label(x - 77, y - 141 + collapse, 'FW / 09', 15, '#dce8dd');
  if (b.active && b.warning > 0) {
    if (b.phase === 2) {
      for (const dx of [-80, 80]) { const tx = b.targetX + dx - camera; g.lineStyle(2, gold, 0.8); g.strokeEllipse(tx, GROUND - 3, 140, 15); g.lineBetween(tx, 170, tx, GROUND); label(tx - 16, 174, '↓', 24, '#ffd865'); }
    } else {
      const yy = b.phase === 1 ? GROUND - 24 : (b.attack + 1) % 2 ? GROUND - 21 : GROUND - 45;
      g.lineStyle(2, pink, 0.4 + Math.sin(run.elapsed * 20) * 0.2); g.lineBetween(0, yy, x - 80, yy);
    }
    label(x - 130, y - 204, b.phase === 2 ? 'ARTILLERY / MOVE' : b.phase === 3 && (b.attack + 1) % 2 === 0 ? 'HIGH SWEEP / DUCK' : 'LOW VOLLEY / JUMP', 13, '#ffd865');
  }
}
