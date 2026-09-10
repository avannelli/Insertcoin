import { GROUND } from './config';
import { fire, type Projectile } from './entities';
import type { Player } from './player';
export interface Boss { x: number; y: number; hp: number; maxHp: number; phase: number; timer: number; warning: number; targetX: number; attack: number; active: boolean; exposed: boolean; destruction: number; }
export const createBoss = (): Boss => ({ x: 10490, y: GROUND, hp: 150, maxHp: 150, phase: 1, timer: 1.8, warning: 0, targetX: 0, attack: 0, active: false, exposed: true, destruction: 0 });
export function updateBoss(b: Boss, player: Player, pool: Projectile[], dt: number): boolean {
  if (!b.active || b.hp <= 0) return false;
  b.phase = b.hp > 100 ? 1 : b.hp > 50 ? 2 : 3;
  b.timer -= dt; b.exposed = b.warning <= 0;
  if (b.timer <= 0 && b.warning <= 0) { b.warning = b.phase === 3 ? 1.1 : 0.9; b.targetX = player.x; }
  if (b.warning > 0) {
    b.warning -= dt;
    if (b.warning <= 0) {
      b.attack++;
      if (b.phase === 1) {
        // Three clearly spaced, jumpable cannon shots.
        for (let i = 0; i < 3; i++) fire(pool, { x: b.x - 65 + i * 25, y: GROUND - 24, vx: -240, vy: 0, radius: 7, damage: 1, life: 5, team: 'enemy', kind: 'bullet' });
      } else if (b.phase === 2) {
        // Marked artillery lands at the player's old location; keep moving.
        for (const offset of [-80, 80]) fire(pool, { x: b.targetX + offset, y: 110, vx: 0, vy: 40, radius: 8, damage: 1, life: 2, team: 'enemy', kind: 'shell' });
      } else {
        // Alternating low and high sweeps, each announced by a sight line.
        const y = b.attack % 2 ? GROUND - 21 : GROUND - 45;
        for (let i = 0; i < 5; i++) fire(pool, { x: b.x - 70 + i * 34, y, vx: -340, vy: 0, radius: 6, damage: 1, life: 4, team: 'enemy', kind: 'bullet' });
      }
      b.timer = b.phase === 3 ? 1.5 : 2.0; b.exposed = true; return true;
    }
  }
  return false;
}
