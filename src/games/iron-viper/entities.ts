import { MAX_EFFECTS, MAX_PROJECTILES, type Point } from './config';
import type { PickupKind, EnemyKind } from './level';
export interface Projectile extends Point { active: boolean; vx: number; vy: number; radius: number; damage: number; life: number; team: 'player' | 'enemy'; kind: 'bullet' | 'rocket' | 'grenade' | 'shell'; }
export interface Effect extends Point { active: boolean; life: number; maxLife: number; size: number; color: number; kind: 'blast' | 'spark' | 'dust'; }
export interface Pickup extends Point { id: string; kind: PickupKind; active: boolean; }
export interface Enemy extends Point { id: string; kind: EnemyKind; hp: number; maxHp: number; alive: boolean; timer: number; warning: number; burst: number; facing: number; hit: number; spawn: number; baseY: number; }
export function createProjectilePool(): Projectile[] { return Array.from({ length: MAX_PROJECTILES }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 3, damage: 1, life: 0, team: 'player', kind: 'bullet' })); }
export function fire(pool: Projectile[], data: Omit<Projectile, 'active'>) { const p = pool.find(p => !p.active); if (p) Object.assign(p, data, { active: true }); }
export function createEffects(): Effect[] { return Array.from({ length: MAX_EFFECTS }, () => ({ active: false, x: 0, y: 0, life: 0, maxLife: 1, size: 1, color: 0xffffff, kind: 'spark' })); }
export function effect(pool: Effect[], x: number, y: number, kind: Effect['kind'], size: number, color: number) {
  const e = pool.find(e => !e.active); if (e) Object.assign(e, { active: true, x, y, kind, size, color, life: kind === 'blast' ? 0.55 : 0.25, maxLife: kind === 'blast' ? 0.55 : 0.25 });
}
/** Closest approach of a moving shot to a target; prevents thin targets being skipped. */
export function sweptHit(ax: number, ay: number, bx: number, by: number, x: number, y: number, rx: number, ry: number) {
  const dx = (bx - ax) / rx, dy = (by - ay) / ry, px = (x - ax) / rx, py = (y - ay) / ry;
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / Math.max(0.0001, dx * dx + dy * dy)));
  return (px - dx * t) ** 2 + (py - dy * t) ** 2 <= 1;
}
