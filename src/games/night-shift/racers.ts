import { hazards, trackAt } from './track';
export interface Racer { id: number; name: string; color: number; distance: number; lane: number; speed: number; topSpeed: number; acceleration: number; targetLane: number; reaction: number; finishTime?: number; }
export function createRacers(): Racer[] {
  return [0xef4db8, 0x58e6cf, 0xff994e, 0x9787f0, 0xf7ed59, 0xe9edf6, 0x488df0].map((color, i) => ({
    id: i + 1, name: ['VECTOR', 'ECHO', 'EMBER', 'VIOLET', 'VOLT', 'GHOST', 'COBALT'][i], color,
    distance: 24 + (6 - i) * 12, lane: i % 2 ? 0.4 : -0.4, speed: 0,
    topSpeed: 75 + (6 - i) * 0.7, acceleration: 14 + (6 - i) * 0.5, targetLane: i % 2 ? 0.4 : -0.4, reaction: i * 0.06,
  }));
}
export function updateRacers(racers: Racer[], player: { distance: number; lane: number; speed: number }, dt: number, time: number) {
  for (const car of racers) {
    if (car.finishTime !== undefined) continue;
    const curve = Math.abs(trackAt(car.distance).curve);
    let desiredSpeed = car.topSpeed * (1 - curve * (0.025 + car.id * 0.002));
    car.reaction -= dt;
    const traffic = [...racers.filter(other => other !== car), player];
    const ahead = traffic.filter(other => other.distance > car.distance && other.distance - car.distance < 42 && Math.abs(other.lane - car.lane) < 0.27).sort((a, b) => a.distance - b.distance)[0];
    const danger = hazards.find(hazard => hazard.distance > car.distance && hazard.distance - car.distance < Math.max(65, car.speed * 1.3) && Math.abs(hazard.lane - car.lane) < 0.32);
    if (ahead && !danger) desiredSpeed += 1.1; // Rivals can draft too.
    if (car.reaction <= 0) {
      car.reaction = 0.32 + car.id * 0.045;
      if (ahead || danger) {
        const options = [-0.64, 0, 0.64].filter(lane => !traffic.some(other => Math.abs(other.distance - car.distance) < 18 && Math.abs(other.lane - lane) < 0.3)
          && !hazards.some(hazard => hazard.distance > car.distance && hazard.distance - car.distance < 100 && Math.abs(hazard.lane - lane) < 0.32));
        if (options.length) car.targetLane = options.reduce((best, lane) => Math.abs(lane - car.lane) < Math.abs(best - car.lane) ? lane : best);
      } else if (Math.sin(time * 0.12 + car.id * 3) > 0.94) car.targetLane = Math.sin(car.id * 2 + time * 0.06) * 0.6;
    }
    if (ahead && ahead.distance - car.distance < 17 && Math.abs(car.lane - ahead.lane) < 0.25) desiredSpeed = Math.min(desiredSpeed, ahead.speed * 0.98);
    if (danger && Math.abs(car.lane - car.targetLane) < 0.2) desiredSpeed *= 0.8;
    // Small deterministic lapses create opportunities without rubber-banding.
    if (Math.sin(time * 0.14 + car.id * 1.8) > 0.965) desiredSpeed *= 0.9;
    car.lane += Math.max(-dt * 0.65, Math.min(dt * 0.65, car.targetLane - car.lane));
    car.speed += Math.max(-dt * 18, Math.min(dt * car.acceleration, desiredSpeed - car.speed));
    const previous = car.distance;
    car.distance += car.speed * dt;
    for (const hazard of hazards) {
      if (previous < hazard.distance && car.distance >= hazard.distance && Math.abs(hazard.lane - car.lane) < (hazard.kind === 'barrier' ? 0.22 : 0.15)) car.speed *= hazard.kind === 'cone' ? 0.83 : hazard.kind === 'oil' ? 0.74 : 0.52;
    }
  }
}
