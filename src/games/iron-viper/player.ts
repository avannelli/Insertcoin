import { clamp, GRAVITY, GROUND, JUMP_SPEED, MAX_HEALTH, MOVE_SPEED, type Input } from './config';
import { platforms, pits } from './level';
import type { WeaponId } from './weapons';
export interface Player {
  x: number; y: number; vx: number; vy: number; facing: number; grounded: boolean; crouching: boolean;
  health: number; invulnerable: number; weapon: WeaponId; ammo: number; grenades: number;
  fireCooldown: number; grenadeCooldown: number; muzzle: number; vehicle: boolean; vehicleHealth: number;
}
export const createPlayer = (x = 90): Player => ({ x, y: GROUND, vx: 0, vy: 0, facing: 1, grounded: true, crouching: false,
  health: MAX_HEALTH, invulnerable: 1.5, weapon: 'pulse', ammo: -1, grenades: 4,
  fireCooldown: 0, grenadeCooldown: 0, muzzle: 0, vehicle: false, vehicleHealth: 0 });
export function movePlayer(p: Player, input: Input, dt: number, left: number, right: number, jumpPressed: boolean): boolean {
  p.invulnerable = Math.max(0, p.invulnerable - dt); p.muzzle = Math.max(0, p.muzzle - dt);
  p.fireCooldown = Math.max(0, p.fireCooldown - dt); p.grenadeCooldown = Math.max(0, p.grenadeCooldown - dt);
  p.crouching = input.crouch && p.grounded && !p.vehicle;
  const target = input.move * (p.vehicle ? 260 : p.crouching ? 70 : MOVE_SPEED);
  p.vx += clamp(target - p.vx, -dt * (p.grounded ? 1900 : 900), dt * (p.grounded ? 1900 : 900));
  if (input.move) p.facing = input.move > 0 ? 1 : -1;
  if (jumpPressed && p.grounded) { p.vy = p.vehicle ? -320 : -JUMP_SPEED; p.grounded = false; }
  const oldY = p.y;
  p.x = clamp(p.x + p.vx * dt, left + 20, right - 20); p.vy += GRAVITY * dt; p.y += p.vy * dt; p.grounded = false;
  for (const platform of platforms) {
    if (p.vy >= 0 && oldY <= platform.y + 1 && p.y >= platform.y && p.x > platform.x - 8 && p.x < platform.x + platform.width + 8) { p.y = platform.y; p.vy = 0; p.grounded = true; break; }
  }
  const overPit = pits.some(pit => p.x > pit.x && p.x < pit.x + pit.width);
  if (!overPit && p.y >= GROUND && oldY <= GROUND + 2) { p.y = GROUND; p.vy = 0; p.grounded = true; }
  return !p.vehicle && p.grounded && oldY < p.y - 1;
}
export const playerCenterY = (p: Player) => p.y - (p.vehicle ? 24 : p.crouching ? 14 : 26);
