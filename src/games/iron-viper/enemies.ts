import { clamp, GROUND } from './config';
import { fire, type Enemy, type Projectile } from './entities';
import { pits, type EnemyKind } from './level';
import { playerCenterY, type Player } from './player';
export const enemyHealth: Record<EnemyKind, number> = { rifle: 3, rusher: 2, elevated: 3, armor: 10, drone: 3 };
export function createEnemy(id: string, kind: EnemyKind, x: number): Enemy {
  const y = kind === 'elevated' ? GROUND - 120 : kind === 'drone' ? GROUND - 150 : GROUND;
  return { id, kind, x, y, baseY: y, hp: enemyHealth[kind], maxHp: enemyHealth[kind], alive: true, timer: 1.2, warning: 0, burst: 0, facing: -1, hit: 0, spawn: 0.85 };
}
export function updateEnemies(enemies: Enemy[], player: Player, pool: Projectile[], dt: number, elapsed: number): boolean {
  let shot = false;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.kind !== 'drone' && e.kind !== 'elevated') {
      for (const pit of pits) if (e.x > pit.x - 15 && e.x < pit.x + pit.width + 15) e.x = e.x < pit.x + pit.width / 2 ? pit.x - 15 : pit.x + pit.width + 15;
    }
    e.hit = Math.max(0, e.hit - dt);
    if (e.spawn > 0) { e.spawn -= dt; continue; }
    const dx = player.x - e.x, distance = Math.abs(dx); e.facing = dx > 0 ? 1 : -1;
    if (e.kind === 'drone') e.y = e.baseY + Math.sin(elapsed * 2 + e.x * 0.01) * 22;
    if (distance > 620) { if (e.kind !== 'elevated') e.x += e.facing * 35 * dt; continue; }
    e.timer -= dt;
    if (e.kind === 'rusher') {
      if (distance > 26) e.x += e.facing * (e.timer < 0 ? 155 : 65) * dt;
      if (e.timer < -1.1) e.timer = 1.1;
      e.warning = e.timer > 0 && e.timer < 0.45 ? e.timer : 0; continue;
    }
    if (e.timer <= 0 && e.warning <= 0) e.warning = e.kind === 'armor' ? 0.85 : 0.65;
    if (e.warning > 0) {
      e.warning -= dt;
      if (e.warning <= 0) {
        const originY = e.y - (e.kind === 'drone' ? 0 : 28);
        const aimY = e.kind === 'rifle' ? GROUND - 29 : playerCenterY(player);
        const angle = Math.atan2(aimY - originY, dx);
        const speed = e.kind === 'drone' ? 175 : e.kind === 'armor' ? 200 : 220;
        const angles = e.kind === 'drone' ? [-0.2, 0.2] : [0];
        for (const offset of angles) fire(pool, { x: e.x + e.facing * 20, y: originY, vx: Math.cos(angle + offset) * speed, vy: Math.sin(angle + offset) * speed, radius: e.kind === 'armor' ? 6 : 4, damage: 1, life: 4, team: 'enemy', kind: 'bullet' });
        e.burst++; e.timer = e.kind === 'rifle' && e.burst % 3 !== 0 ? 0.12 : 1.3 + (e.kind === 'armor' ? 0.7 : 0); shot = true;
      }
    } else if (e.kind !== 'elevated') {
      e.x += (distance > 280 ? e.facing : distance < 130 ? -e.facing : Math.sin(elapsed + e.x * 0.01)) * (e.kind === 'armor' ? 22 : 45) * dt;
    }
    e.x = clamp(e.x, player.x - 650, player.x + 900);
  }
  return shot;
}
