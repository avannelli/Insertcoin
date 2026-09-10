export const TRACK_LENGTH = 9900;
export const ROAD_HALF_WIDTH = 8;
export interface TrackSection { name: string; length: number; curve: number; hill: number; }
export const sections: TrackSection[] = [
  { name: 'MIDNIGHT GRID', length: 900, curve: 0, hill: 0 },
  { name: 'HARBOR SWEEP', length: 1300, curve: 0.75, hill: 0.25 },
  { name: 'CITY STRAIGHT', length: 1000, curve: 0, hill: 0 },
  { name: 'WEST VIADUCT', length: 1300, curve: -1.1, hill: 0.4 },
  { name: 'ROAD WORKS', length: 900, curve: 0.3, hill: 0 },
  { name: 'RIDGE RUN', length: 1300, curve: 1.2, hill: 0.5 },
  { name: 'NEON VALLEY', length: 1000, curve: -0.85, hill: -0.25 },
  { name: 'LAST CHANCE', length: 1000, curve: 0.6, hill: 0 },
  { name: 'FINAL STRAIGHT', length: 1200, curve: 0, hill: 0 },
];
export function trackAt(distance: number) {
  let start = 0;
  for (const section of sections) {
    if (distance < start + section.length) {
      const t = Math.max(0, (distance - start) / section.length);
      const blend = Math.min(1, t * 5, (1 - t) * 5);
      const ease = (1 - Math.cos(blend * Math.PI)) / 2;
      return { curve: section.curve * ease, hill: section.hill * Math.sin(t * Math.PI), name: section.name };
    }
    start += section.length;
  }
  return { curve: 0, hill: 0, name: 'FINISH' };
}
export interface Hazard { distance: number; lane: number; kind: 'cone' | 'barrier' | 'oil'; }
// Authored hazards: never fill all lanes, with long sight lines and a clear starting straight.
export const hazards: Hazard[] = [
  { distance: 1050, lane: -0.65, kind: 'cone' }, { distance: 1380, lane: 0.6, kind: 'barrier' },
  { distance: 1710, lane: 0, kind: 'oil' }, { distance: 2050, lane: -0.55, kind: 'cone' },
  { distance: 2350, lane: 0.6, kind: 'barrier' },
  { distance: 2600, lane: -0.65, kind: 'cone' }, { distance: 2810, lane: -0.65, kind: 'cone' },
  { distance: 4480, lane: 0.65, kind: 'barrier' }, { distance: 4700, lane: 0.65, kind: 'cone' },
  { distance: 4920, lane: -0.4, kind: 'oil' }, { distance: 6820, lane: 0.45, kind: 'oil' },
  { distance: 7850, lane: -0.7, kind: 'barrier' }, { distance: 8180, lane: 0.65, kind: 'cone' },
  { distance: 3120, lane: 0.5, kind: 'oil' }, { distance: 3410, lane: 0, kind: 'cone' },
  { distance: 3710, lane: -0.6, kind: 'barrier' }, { distance: 4080, lane: 0.55, kind: 'cone' },
  { distance: 5230, lane: -0.6, kind: 'cone' }, { distance: 5510, lane: 0.15, kind: 'barrier' },
  { distance: 5810, lane: 0.65, kind: 'oil' }, { distance: 6120, lane: -0.55, kind: 'barrier' },
  { distance: 6440, lane: 0.6, kind: 'cone' }, { distance: 7130, lane: -0.6, kind: 'cone' },
  { distance: 7460, lane: 0, kind: 'oil' }, { distance: 8500, lane: -0.55, kind: 'barrier' },
  { distance: 8840, lane: 0.55, kind: 'cone' }, { distance: 9170, lane: -0.55, kind: 'oil' },
  { distance: 9510, lane: 0, kind: 'cone' }, { distance: 9850, lane: 0.65, kind: 'barrier' },
].sort((a, b) => a.distance - b.distance) as Hazard[];
