import { ROAD_HALF_WIDTH, trackAt } from './track';
export const VIEW_WIDTH = 800, VIEW_HEIGHT = 560, ROAD_BOTTOM = 430;
export interface RoadPoint { z: number; x: number; y: number; half: number; scale: number; }
export function projectRoad(distance: number, lane: number, rear = false): RoadPoint[] {
  const points: RoadPoint[] = [];
  let offset = 0, heading = 0;
  const horizon = 150 + trackAt(distance).hill * 14;
  let previousZ = 9;
  for (let z = 9; z <= 865; z *= 1.065) {
    const step = z - previousZ;
    const direction = rear ? -1 : 1;
    heading += trackAt(Math.max(0, distance + direction * z)).curve * direction * 0.00065 * step;
    offset += heading * step;
    const scale = 500 / z;
    points.push({ z, x: 400 + (offset - lane * direction * ROAD_HALF_WIDTH) * scale, y: horizon + 2500 / z, half: ROAD_HALF_WIDTH * scale, scale });
    previousZ = z;
  }
  return points;
}
export function projectAt(points: RoadPoint[], z: number): RoadPoint | undefined {
  if (z < 9 || z > 809) return;
  let index = 0;
  while (index < points.length - 2 && points[index + 1].z < z) index++;
  const a = points[index], b = points[index + 1], t = (z - a.z) / (b.z - a.z);
  return { z, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, half: a.half + (b.half - a.half) * t, scale: a.scale + (b.scale - a.scale) * t };
}
