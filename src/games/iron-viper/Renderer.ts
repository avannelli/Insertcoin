import Phaser from 'phaser';
import { WIDTH, clamp } from './config';
import { LEVEL_END } from './level';
import type { IronViperRun } from './model';
import { weapons } from './weapons';
import { background, scenery, bossArt } from './worldArt';
import { hero, enemyArt, cyan, pink, gold, ink } from './actorArt';

export class ViperRenderer {
  private world: Phaser.GameObjects.Graphics;
  private actors: Phaser.GameObjects.Graphics;
  private overlay: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private labelIndex = 0;
  camera = 0;
  constructor(private scene: Phaser.Scene) { this.world = scene.add.graphics(); this.actors = scene.add.graphics(); this.overlay = scene.add.graphics(); }
  private label = (x: number, y: number, text: string, size = 14, color = '#c3d6df') => {
    let label = this.labels[this.labelIndex];
    if (!label) { label = this.scene.add.text(0, 0, '', { fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(10); this.labels.push(label); }
    label.setVisible(true).setPosition(Math.round(x), Math.round(y)).setText(text).setFontSize(size).setColor(color);
    this.labelIndex++;
  };
  draw(run: IronViperRun, aimUp: boolean, reducedMotion: boolean) {
    this.camera = run.boss.active || run.boss.hp <= 0 ? 9800 : clamp(run.player.x - 260, run.sector.start, LEVEL_END - WIDTH);
    const g = this.world, a = this.actors, ui = this.overlay, camera = this.camera;
    this.labelIndex = 0; g.clear(); a.clear(); ui.clear();
    const time = run.elapsed;
    background(g, camera, reducedMotion ? 0 : time, run.sectorIndex);
    scenery(g, run, camera, this.label); bossArt(g, run, camera, this.label);
    for (const e of run.enemies) if (e.alive && e.x - camera > -70 && e.x - camera < WIDTH + 70) enemyArt(g, e, camera, time);
    for (const pickup of run.pickups) if (pickup.active) {
      const x = pickup.x - camera, y = pickup.y - 5 + (reducedMotion ? 0 : Math.sin(time * 4) * 4);
      if (x < -50 || x > WIDTH + 50) continue;
      g.fillStyle(cyan, 0.12); g.fillCircle(x, y, 29); g.fillStyle(ink); g.fillRect(x - 18, y - 15, 36, 30);
      g.lineStyle(2, pickup.kind === 'health' ? pink : cyan); g.strokeRect(x - 18, y - 15, 36, 30);
      this.label(x - 8, y - 11, ({ coil: 'C', fan: 'A', comet: 'R', health: '+', grenade: 'G' })[pickup.kind], 21, '#ffe079');
    }
    hero(a, run.player, camera, time + (run.phase === 'dying' ? run.timer : 0), aimUp, run.phase === 'dying');
    for (const shot of run.projectiles) if (shot.active) {
      const x = shot.x - camera;
      g.fillStyle(shot.team === 'enemy' ? pink : gold);
      if (shot.kind === 'bullet') { g.lineStyle(shot.radius * 1.4, shot.team === 'enemy' ? pink : gold); g.lineBetween(x - shot.vx * 0.012, shot.y - shot.vy * 0.012, x, shot.y); g.fillStyle(0xfff2c1); g.fillCircle(x, shot.y, shot.radius * 0.6); }
      else { g.fillCircle(x, shot.y, shot.radius + 1); g.fillStyle(ink); g.fillRect(x - 2, shot.y - 2, 4, 4); if (shot.kind === 'rocket') { g.fillStyle(0xff833d, 0.6); g.fillCircle(x - shot.vx * 0.03, shot.y - shot.vy * 0.03, 7); } }
    }
    for (const fx of run.effects) if (fx.active) {
      const progress = 1 - fx.life / fx.maxLife, x = fx.x - camera;
      g.fillStyle(fx.color, (1 - progress) * 0.6);
      if (fx.kind === 'blast') {
        g.fillCircle(x, fx.y, fx.size * (0.25 + progress * 0.7));
        g.fillStyle(0xffefac, 1 - progress); g.fillCircle(x, fx.y, fx.size * 0.32 * (1 - progress));
        for (let i = 0; i < 7; i++) { const angle = i * 0.9; g.fillStyle(i % 2 ? 0xffa24f : 0x586579, 1 - progress); g.fillRect(x + Math.cos(angle) * fx.size * progress, fx.y + Math.sin(angle) * fx.size * progress, 5, 5); }
      } else {
        for (let i = 0; i < 5; i++) g.fillRect(x + Math.cos(i * 2) * fx.size * progress, fx.y - Math.abs(Math.sin(i * 2)) * fx.size * progress, 4, 3);
      }
    }
    // Foreground fence posts and wet lane markings move at the world speed.
    for (let i = 0; i < 5; i++) { const x = ((i * 240 - camera * 1.08) % 1100 + 1100) % 1100 - 100; g.fillStyle(0x070f20, 0.65); g.fillRect(x, 521, 9, 39); g.fillRect(x - 20, 542, 83, 6); }
    ui.fillStyle(ink, 0.92); ui.fillRect(16, 14, 768, 53); ui.lineStyle(1, 0x4b6073); ui.strokeRect(16, 14, 768, 53);
    this.label(30, 23, run.player.vehicle ? 'SCOUT' : 'HEALTH', 12);
    const health = run.player.vehicle ? run.player.vehicleHealth : run.player.health, total = run.player.vehicle ? 8 : 5;
    for (let i = 0; i < total; i++) { ui.fillStyle(i < health ? cyan : 0x2e394e); ui.fillRect(30 + i * 16, 43, 12, 10); }
    const weapon = weapons[run.player.vehicle ? 'crawler' : run.player.weapon];
    this.label(185, 23, weapon.name, 16, '#ffe079'); this.label(185, 44, `AMMO ${run.player.vehicle || run.player.ammo < 0 ? '∞' : run.player.ammo}`, 12);
    this.label(430, 25, `BLAST CAPS  ${run.player.grenades}`, 15, '#f5bedf');
    this.label(655, 25, `ZONE ${run.sectorIndex + 1}/6`, 14); this.label(655, 44, `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`, 12);
    if (run.boss.active) {
      ui.fillStyle(ink, 0.85); ui.fillRect(190, 82, 420, 42); this.label(202, 87, `FURNACE WARDEN / PHASE ${run.boss.phase}`, 13, '#ef4bba');
      ui.fillStyle(0x3c2d48); ui.fillRect(202, 109, 395, 5); ui.fillStyle(pink); ui.fillRect(202, 109, 395 * run.boss.hp / run.boss.maxHp, 5);
    }
    if (run.phase === 'countdown' || run.phase === 'respawn') {
      const text = run.phase === 'respawn' ? 'BACK IN THE FIGHT' : run.timer > 0.45 ? 'READY' : 'GO!';
      ui.fillStyle(ink, 0.8); ui.fillRect(180, 186, 440, 75); this.label(text.length > 5 ? 218 : 329, 203, text, text.length > 5 ? 29 : 40, '#ffe079');
    }
    if (run.phase === 'dying') this.label(280, 195, 'SIGNAL LOST', 30, '#ef4bba');
    if (run.phase === 'bossDefeat') this.label(254, 165, 'WARDEN DOWN', 34, '#ffe079');
    if (run.chain > 1 && time - run.lastKill < 2.5) this.label(30, 85, `${run.chain}× CHAIN`, 18, '#ffe079');
    if (run.phase === 'playing') {
      this.label(23, 487, run.sector.name, 13, '#8ea8b6');
      if (run.player.x > run.sector.end - 360 && !run.cleared && run.sectorIndex < 5) {
        const remaining = run.enemies.filter(e => e.alive);
        this.label(23, 509, remaining.some(e => e.x < run.player.x - 100) ? '← ENEMIES BEHIND / CLEAR TO ADVANCE' : 'CLEAR REINFORCEMENTS TO OPEN THE GATE', 13, '#f4b8dc');
      }
    }
    for (let i = this.labelIndex; i < this.labels.length; i++) this.labels[i].setVisible(false);
  }
}
