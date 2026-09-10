import { TRACK_LENGTH, hazards, trackAt } from './track';
import { createRacers, updateRacers } from './racers';
export type RacePhase = 'ready' | 'countdown' | 'racing' | 'paused' | 'finish' | 'results';
export interface DriveInput { steer: number; accelerate: boolean; brake: boolean; }
export type RaceEvent = 'beep' | 'go' | 'impact' | 'pass' | 'finish';
export const TOP_SPEED = 82;
export class NightRace {
  phase: RacePhase = 'ready';
  player = { distance: 0, lane: 0, speed: 0 };
  racers = createRacers();
  elapsed = 0;
  countdown = 3;
  cooldown = 0;
  disruption = 0;
  finishDelay = 0;
  finalPosition = 8;
  finishTime = 0;
  events: RaceEvent[] = [];
  private resumed: RacePhase = 'racing';
  private oldPosition = 8;
  private hitHazards = new Set<number>();
  get position() {
    if (this.phase === 'finish' || this.phase === 'results') return this.finalPosition;
    return 1 + this.racers.filter(car => car.finishTime !== undefined || car.distance > this.player.distance).length;
  }
  start() { if (this.phase === 'ready') { this.phase = 'countdown'; this.countdown = 3; this.events.push('beep'); } else if (this.phase === 'paused') this.pause(); }
  pause() {
    if (this.phase === 'paused') this.phase = this.resumed;
    else if (['countdown', 'racing', 'finish'].includes(this.phase)) { this.resumed = this.phase; this.phase = 'paused'; }
  }
  step(delta: number, input: DriveInput) {
    const dt = Math.min(Math.max(delta, 0), 0.05);
    if (this.phase === 'ready' || this.phase === 'paused' || this.phase === 'results') return;
    if (this.phase === 'countdown') {
      const before = Math.ceil(this.countdown); this.countdown -= dt;
      if (this.countdown <= 0) { this.phase = 'racing'; this.events.push('go'); }
      else if (Math.ceil(this.countdown) !== before) this.events.push('beep');
      return;
    }
    if (this.phase === 'finish') { this.finishDelay -= dt; if (this.finishDelay <= 0) this.phase = 'results'; return; }
    const oldTime = this.elapsed, oldDistance = this.player.distance;
    this.elapsed += dt; this.cooldown = Math.max(0, this.cooldown - dt); this.disruption = Math.max(0, this.disruption - dt);
    const p = this.player, curve = trackAt(p.distance).curve;
    const drafting = this.racers.some(car => car.distance > p.distance && car.distance - p.distance < 35 && Math.abs(car.lane - p.lane) < 0.24);
    const acceleration = input.brake ? -38 : input.accelerate ? (drafting ? 23 : 18) : -7;
    p.speed = Math.max(0, Math.min(TOP_SPEED + (drafting ? 3 : 0), p.speed + acceleration * dt));
    p.lane += (input.steer * (0.35 + p.speed / TOP_SPEED * 0.9) * (this.disruption > 0 ? 0.55 : 1) - curve * (p.speed / TOP_SPEED) ** 2 * 0.32) * dt;
    p.lane = Math.max(-1.45, Math.min(1.45, p.lane));
    if (Math.abs(p.lane) > 0.95) p.speed = Math.max(0, p.speed - dt * 40);
    p.distance += p.speed * dt;
    const previous = this.racers.map(car => car.distance);
    updateRacers(this.racers, p, dt, this.elapsed);
    this.racers.forEach((car, i) => {
      if (car.finishTime === undefined && car.distance >= TRACK_LENGTH) car.finishTime = oldTime + dt * (TRACK_LENGTH - previous[i]) / Math.max(0.001, car.distance - previous[i]);
      const relativeBefore = previous[i] - oldDistance, relativeAfter = car.distance - p.distance;
      if (this.cooldown === 0 && Math.abs(car.lane - p.lane) < 0.21 && (Math.abs(relativeAfter) < 4 || relativeBefore * relativeAfter < 0)) this.impact(0.57);
    });
    hazards.forEach((hazard, i) => {
      if (!this.hitHazards.has(i) && oldDistance <= hazard.distance + 2 && p.distance >= hazard.distance - 2 && Math.abs(p.lane - hazard.lane) < (hazard.kind === 'barrier' ? 0.22 : 0.15)) {
        this.hitHazards.add(i); if (this.cooldown === 0) this.impact(hazard.kind === 'cone' ? 0.83 : hazard.kind === 'oil' ? 0.74 : 0.52);
      }
    });
    if (p.distance >= TRACK_LENGTH) {
      this.finishTime = oldTime + dt * (TRACK_LENGTH - oldDistance) / Math.max(0.001, p.distance - oldDistance);
      this.finalPosition = 1 + this.racers.filter(car => car.finishTime !== undefined && car.finishTime <= this.finishTime).length;
      p.distance = TRACK_LENGTH; this.phase = 'finish'; this.finishDelay = 1.2; this.events.push('finish');
    } else if (this.position < this.oldPosition && this.elapsed > 3) this.events.push('pass');
    this.oldPosition = this.position;
  }
  private impact(multiplier: number) { this.player.speed *= multiplier; this.cooldown = 1.1; this.disruption = 0.45; this.events.push('impact'); }
}
