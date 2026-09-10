import { GROUND, type Input } from './config';
import { effect, fire, sweptHit } from './entities';
import type { IronViperRun } from './model';
import { playerCenterY } from './player';
import { weapons } from './weapons';

export function shoot(run: IronViperRun, input: Input) {
  const p = run.player; if (p.fireCooldown > 0) return;
  const id = p.vehicle ? 'crawler' : p.weapon, weapon = weapons[id];
  const angle = input.up ? (input.move ? -Math.PI / 2 + p.facing * Math.PI / 4 : -Math.PI / 2) : p.facing > 0 ? 0 : Math.PI;
  for (const spread of weapon.spread) fire(run.projectiles, { x: p.x + Math.cos(angle) * (p.vehicle ? 48 : 24), y: playerCenterY(p) - 4 + Math.sin(angle) * 19,
    vx: Math.cos(angle + spread) * weapon.speed, vy: Math.sin(angle + spread) * weapon.speed, radius: weapon.explosive ? 5 : 3,
    damage: weapon.damage, life: 1.35, team: 'player', kind: weapon.explosive ? 'rocket' : 'bullet' });
  p.fireCooldown = weapon.cooldown; p.muzzle = 0.08; run.events.push(id);
  if (!p.vehicle && p.ammo > 0 && --p.ammo === 0) { p.weapon = 'pulse'; p.ammo = -1; run.announce('PULSE-9 / UNLIMITED'); }
}
export function throwGrenade(run: IronViperRun) {
  const p = run.player; if (p.grenades <= 0 || p.grenadeCooldown > 0) return;
  p.grenades--; p.grenadeCooldown = 0.6;
  fire(run.projectiles, { x: p.x, y: playerCenterY(p), vx: p.facing * 350, vy: -370, radius: 5, damage: 8, life: 1.15, team: 'player', kind: 'grenade' });
  run.events.push('grenade');
}
export function explode(run: IronViperRun, x: number, y: number, radius: number, damage: number, team: 'player' | 'enemy') {
  effect(run.effects, x, y, 'blast', radius, 0xffb746); run.events.push('blast');
  if (team === 'player') {
    for (const e of run.enemies) if (Math.hypot(e.x - x, e.y - 25 - y) < radius + 20) run.damageEnemy(e, damage);
    for (const prop of run.props) if (Math.hypot(prop.x - x, prop.y - 20 - y) < radius + 20) run.damageProp(prop, damage);
    if (Math.hypot(run.boss.x - 20 - x, GROUND - 40 - y) < radius + 45) run.damageBoss(damage);
  } else if (Math.hypot(run.player.x - x, playerCenterY(run.player) - y) < radius + 12) run.damagePlayer();
}
export function stepProjectiles(run: IronViperRun, dt: number) {
  for (const shot of run.projectiles) {
    if (!shot.active) continue;
    const ax = shot.x, ay = shot.y; shot.life -= dt;
    if (shot.kind === 'grenade' || shot.kind === 'shell') shot.vy += 700 * dt;
    shot.x += shot.vx * dt; shot.y += shot.vy * dt;
    const detonates = shot.kind !== 'bullet';
    if (shot.kind === 'grenade' && shot.y >= GROUND - 5) { shot.y = GROUND - 5; shot.vy = -Math.abs(shot.vy) * 0.35; shot.vx *= 0.8; }
    if (shot.life <= 0 || shot.kind === 'shell' && shot.y >= GROUND - 5) {
      shot.active = false; if (detonates) explode(run, shot.x, shot.y, shot.kind === 'grenade' ? 100 : 70, shot.damage, shot.team); continue;
    }
    if (shot.kind === 'grenade' || shot.kind === 'shell') continue;
    if (shot.team === 'enemy') {
      const p = run.player;
      if (sweptHit(ax, ay, shot.x, shot.y, p.x, playerCenterY(p), (p.vehicle ? 36 : 12) + shot.radius, (p.crouching ? 10 : 22) + shot.radius)) { shot.active = false; run.damagePlayer(); }
    } else {
      const enemy = run.enemies.find(e => e.alive && e.spawn <= 0 && sweptHit(ax, ay, shot.x, shot.y, e.x, e.y - (e.kind === 'drone' ? 0 : 23), (e.kind === 'armor' ? 23 : 16) + shot.radius, (e.kind === 'drone' ? 12 : 23) + shot.radius));
      const prop = !enemy && run.props.find(p => p.alive && sweptHit(ax, ay, shot.x, shot.y, p.x, p.y - 20, 24 + shot.radius, 22 + shot.radius));
      const bossHit = !enemy && !prop && run.boss.active && sweptHit(ax, ay, shot.x, shot.y, run.boss.x - 20, GROUND - 40, 45 + shot.radius, 34 + shot.radius);
      if (enemy || prop || bossHit) {
        shot.active = false;
        if (shot.kind === 'rocket') explode(run, shot.x, shot.y, 80, shot.damage, 'player');
        else { if (enemy) run.damageEnemy(enemy, shot.damage); else if (prop) run.damageProp(prop, shot.damage); else run.damageBoss(shot.damage); effect(run.effects, shot.x, shot.y, 'spark', 12, 0xfff277); }
      }
    }
    if (shot.y < -80 || shot.y > 600 || Math.abs(shot.x - run.player.x) > 1300) shot.active = false;
  }
}
