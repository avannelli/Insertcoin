import { GROUND } from './config';
export type EnemyKind = 'rifle' | 'rusher' | 'elevated' | 'armor' | 'drone';
export type PickupKind = 'coil' | 'fan' | 'comet' | 'health' | 'grenade';
export interface Sector { name: string; start: number; end: number; waves: EnemyKind[][]; interval: number; }
const patterns: EnemyKind[][] = [
  ['rifle', 'rusher', 'rifle'], ['rifle', 'drone', 'rusher'], ['armor', 'rifle', 'elevated'],
  ['rusher', 'drone', 'rifle'], ['armor', 'rusher', 'drone'],
];
export const sectors: Sector[] = [
  { name: '01 / RAINLINE APPROACH', start: 0, end: 1750, waves: patterns.map((wave, i) => i < 2 ? ['rifle', 'rusher'] : wave), interval: 10 },
  { name: '02 / NEON CHECKPOINT', start: 1750, end: 3500, waves: patterns, interval: 10 },
  { name: '03 / FREIGHT YARD', start: 3500, end: 5300, waves: patterns, interval: 10 },
  { name: '04 / SKYBRIDGE WORKS', start: 5300, end: 7100, waves: [...patterns].reverse(), interval: 10 },
  { name: '05 / CRAWLER RUN', start: 7100, end: 9000, waves: patterns.map(() => ['armor', 'drone', 'rifle']), interval: 10 },
  { name: '06 / THE FURNACE GATE', start: 9000, end: 10800, waves: [], interval: 0 },
];
export const LEVEL_END = 10800;
export interface Platform { x: number; y: number; width: number; }
export const platforms: Platform[] = [
  { x: 850, y: 340, width: 170 }, { x: 2400, y: 340, width: 200 },
  { x: 4000, y: 345, width: 240 }, { x: 5510, y: 340, width: 180 },
  { x: 5790, y: 270, width: 170 }, { x: 6070, y: 340, width: 210 },
  { x: 6520, y: 345, width: 180 }, { x: 8000, y: 340, width: 210 },
];
export const pits = [{ x: 5670, width: 90 }, { x: 6330, width: 100 }];
export interface Prop { id: number; x: number; y: number; hp: number; kind: 'crate' | 'barrel' | 'barricade'; drop?: PickupKind; alive: boolean; }
export function createProps(): Prop[] {
  return sectors.flatMap((sector, i) => [
    { id: i * 3, x: sector.start + 340, y: GROUND, hp: 2, kind: 'crate' as const, drop: (['coil', 'fan', 'comet', 'coil', 'grenade', 'comet'] as PickupKind[])[i], alive: true },
    { id: i * 3 + 1, x: sector.start + 850, y: GROUND, hp: 2, kind: 'barrel' as const, alive: true },
    { id: i * 3 + 2, x: sector.start + 1230, y: GROUND, hp: 4, kind: 'barricade' as const, drop: i % 2 ? 'health' as const : 'grenade' as const, alive: true },
  ]);
}
