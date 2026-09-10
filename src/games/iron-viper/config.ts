export const WIDTH = 800, HEIGHT = 560, GROUND = 442;
export const MOVE_SPEED = 205, GRAVITY = 1120, JUMP_SPEED = 520;
export const MAX_HEALTH = 5, START_LIVES = 3, MAX_CONTINUES = 2;
export const MAX_PROJECTILES = 180, MAX_EFFECTS = 90;
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export interface Point { x: number; y: number; }
export interface Input { move: number; up: boolean; crouch: boolean; jump: boolean; fire: boolean; grenade: boolean; }
export const idleInput = (): Input => ({ move: 0, up: false, crouch: false, jump: false, fire: false, grenade: false });
