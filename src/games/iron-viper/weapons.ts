export type WeaponId = 'pulse' | 'coil' | 'fan' | 'comet' | 'crawler';
export interface Weapon { name: string; cooldown: number; damage: number; speed: number; ammo: number; spread: number[]; explosive: boolean; }
export const weapons: Record<WeaponId, Weapon> = {
  pulse: { name: 'PULSE-9', cooldown: 0.18, damage: 1, speed: 680, ammo: -1, spread: [0], explosive: false },
  coil: { name: 'COIL STORM', cooldown: 0.075, damage: 1.5, speed: 800, ammo: 140, spread: [0], explosive: false },
  fan: { name: 'ARC FAN', cooldown: 0.3, damage: 1.5, speed: 650, ammo: 45, spread: [-0.2, 0, 0.2], explosive: false },
  comet: { name: 'COMET TUBE', cooldown: 0.55, damage: 7, speed: 430, ammo: 22, spread: [0], explosive: true },
  crawler: { name: 'MANTIS CANNON', cooldown: 0.2, damage: 3, speed: 700, ammo: -1, spread: [0], explosive: false },
};
