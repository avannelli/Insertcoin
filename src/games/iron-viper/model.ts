import { GROUND, HEIGHT, MAX_CONTINUES, MAX_HEALTH, START_LIVES, idleInput, type Input } from './config';
import { createBoss, updateBoss } from './boss';
import { createEffects, createProjectilePool, effect, type Enemy, type Pickup } from './entities';
import { createEnemy, updateEnemies } from './enemies';
import { createProps, sectors, type Prop } from './level';
import { createPlayer, movePlayer, playerCenterY } from './player';
import { weapons } from './weapons';
import { explode, shoot, stepProjectiles, throwGrenade } from './combat';

export type Phase = 'ready' | 'countdown' | 'playing' | 'paused' | 'dying' | 'respawn' | 'continue' | 'over' | 'bossDefeat' | 'complete';
export class IronViperRun {
  player = createPlayer(); boss = createBoss(); enemies: Enemy[] = []; props = createProps(); pickups: Pickup[] = [];
  projectiles = createProjectilePool(); effects = createEffects(); events: string[] = [];
  phase: Phase = 'ready'; previousPhase: Phase = 'playing'; score = 0; lives = START_LIVES; continues = 0;
  elapsed = 0; timer = 0; sectorIndex = 0; checkpoint = 90; nextWave = 0; waveTimer = 0;
  vehicleClaimed = false; chain = 0; lastKill = -10; notice = ''; noticeTime = 0;
  previousInput = idleInput(); lastContinueTick = 10;
  get sector() { return sectors[this.sectorIndex]; }
  get cleared() { return this.nextWave >= this.sector.waves.length && !this.enemies.some(e => e.alive); }
  announce(text: string, seconds = 2) { this.notice = text; this.noticeTime = seconds; }
  start() {
    if (this.phase === 'ready') { this.phase = 'countdown'; this.timer = 1.25; this.events.push('start'); }
    else if (this.phase === 'paused') this.phase = this.previousPhase;
    else if (this.phase === 'continue' && this.timer > 0 && this.continues < MAX_CONTINUES) {
      this.continues++; this.lives = START_LIVES; this.respawn();
    }
  }
  pause() {
    if (this.phase === 'paused') this.start();
    else if (['playing', 'countdown', 'respawn', 'dying', 'bossDefeat'].includes(this.phase)) { this.previousPhase = this.phase; this.phase = 'paused'; }
    this.previousInput = idleInput();
  }
  update(dt: number, input: Input) {
    dt = Math.min(dt, 1 / 30);
    if (['ready', 'paused', 'over', 'complete'].includes(this.phase)) return;
    for (const fx of this.effects) if (fx.active) { fx.life -= dt; if (fx.life <= 0) fx.active = false; }
    this.timer -= dt;
    if (this.phase === 'continue') {
      const tick = Math.ceil(this.timer);
      if (tick < this.lastContinueTick && tick > 0) { this.events.push('tick'); this.lastContinueTick = tick; }
      if (this.timer <= 0) { this.phase = 'over'; this.events.push('gameover'); }
      return;
    }
    if (this.phase === 'dying') {
      if (this.timer <= 0) {
        if (this.lives > 0) this.respawn();
        else if (this.continues < MAX_CONTINUES) { this.phase = 'continue'; this.timer = 9; this.lastContinueTick = 10; }
        else { this.phase = 'over'; this.events.push('gameover'); }
      }
      return;
    }
    if (this.phase === 'bossDefeat') {
      const beat = Math.floor(this.timer * 6);
      if (beat !== this.boss.destruction) {
        this.boss.destruction = beat;
        effect(this.effects, this.boss.x + Math.sin(beat * 7) * 80, GROUND - 35 - (beat % 4) * 28, 'blast', 65, 0xffbb52);
        this.events.push('blast');
      }
      if (this.timer <= 0) { this.phase = 'complete'; this.score += 3000 + Math.max(0, 6000 - Math.floor(this.elapsed * 10)); this.events.push('win'); }
      return;
    }
    if (this.phase === 'countdown' || this.phase === 'respawn') {
      if (this.timer <= 0) { this.phase = 'playing'; this.announce(this.sector.name); }
      return;
    }
    this.elapsed += dt; this.noticeTime -= dt; if (this.noticeTime <= 0) this.notice = '';
    const jump = input.jump && !this.previousInput.jump, grenade = input.grenade && !this.previousInput.grenade;
    const right = this.boss.active ? this.boss.x - 105 : this.cleared ? this.sector.end + 50 : this.sector.end - 70;
    if (movePlayer(this.player, input, dt, this.boss.active ? 9800 : this.sector.start, right, jump)) effect(this.effects, this.player.x, this.player.y, 'dust', 18, 0x8193a8);
    this.previousInput = { ...input };
    if (this.player.y > HEIGHT + 60) {
      this.damagePlayer();
      this.player.x = this.checkpoint; this.player.y = GROUND; this.player.vy = 0; this.clearShots();
    }
    if (this.phase !== 'playing') return;
    if (input.fire) shoot(this, input);
    if (grenade) throwGrenade(this);
    this.vehicle(input);
    this.encounters(dt);
    if (updateEnemies(this.enemies, this.player, this.projectiles, dt, this.elapsed)) this.events.push('enemyShot');
    if (updateBoss(this.boss, this.player, this.projectiles, dt)) this.events.push('boss');
    stepProjectiles(this, dt);
    for (const e of this.enemies) if (e.alive && e.spawn <= 0 && Math.abs(e.x - this.player.x) < (this.player.vehicle ? 40 : 24) && Math.abs(e.y - this.player.y) < 40) this.damagePlayer();
    for (const pickup of this.pickups) if (pickup.active && Math.abs(pickup.x - this.player.x) < 32 && Math.abs(pickup.y - playerCenterY(this.player)) < 45) this.collect(pickup);
  }
  encounters(dt: number) {
    const s = this.sector;
    if (this.sectorIndex === 5) {
      if (!this.boss.active && this.boss.hp > 0 && this.player.x > 9980) { this.boss.active = true; this.checkpoint = 9960; this.announce('FURNACE WARDEN / STRIKE THE CYAN CORE', 3); this.events.push('boss'); }
      return;
    }
    if (this.player.x > s.start + 220) {
      this.waveTimer -= dt;
      if (this.nextWave < s.waves.length && this.waveTimer <= 0 && this.enemies.filter(e => e.alive).length < 9) {
        this.enemies = this.enemies.filter(e => e.alive);
        const wave = this.nextWave++;
        s.waves[wave].forEach((kind, i) => {
          // A full second of visible arrival and at least 270px of separation.
          const forward = this.player.x + 330 + i * 85;
          const x = forward < s.end - 80 ? forward : Math.max(s.start + 100, this.player.x - 330 - i * 85);
          this.enemies.push(createEnemy(`${this.sectorIndex}-${wave}-${i}`, kind, x));
        });
        this.waveTimer = s.interval;
        this.announce(`REINFORCEMENTS / ${this.nextWave} OF ${s.waves.length}`, 1.3);
      }
    }
    if (this.cleared && this.player.x >= s.end - 30) {
      this.sectorIndex++; this.checkpoint = this.sector.start + 60; this.player.x = this.checkpoint;
      this.nextWave = 0; this.waveTimer = 0; this.enemies = []; this.clearShots();
      this.player.health = Math.min(MAX_HEALTH, this.player.health + 1); this.player.grenades = Math.min(9, this.player.grenades + 1);
      this.announce(`CHECKPOINT / ${this.sector.name}`, 3); this.events.push('checkpoint');
    }
  }
  vehicle(input: Input) {
    if (this.sectorIndex === 4 && !this.vehicleClaimed && Math.abs(this.player.x - 7240) < 80) {
      this.announce('MANTIS SCOUT / PRESS UP TO BOARD', 0.15);
      if (input.up) { this.vehicleClaimed = true; this.player.vehicle = true; this.player.vehicleHealth = 8; this.player.invulnerable = 1.5; this.events.push('vehicle'); this.announce('MANTIS ONLINE / FIRE + HOP', 2); }
    }
    if (this.player.vehicle && this.player.x >= 8820) this.exitVehicle();
  }
  exitVehicle() {
    if (!this.player.vehicle) return;
    this.player.vehicle = false; this.player.invulnerable = 1.8;
    effect(this.effects, this.player.x - 30, GROUND - 20, 'blast', 55, 0xffbb52);
    this.events.push('blast'); this.announce('SCOUT OFFLINE / ON FOOT', 1.5);
  }
  damagePlayer() {
    const p = this.player;
    if (this.phase !== 'playing' || p.invulnerable > 0) return;
    p.invulnerable = 1.35; this.events.push('damage'); effect(this.effects, p.x, playerCenterY(p), 'spark', 28, 0xef4bbe);
    if (p.vehicle) { if (--p.vehicleHealth <= 0) this.exitVehicle(); return; }
    if (--p.health <= 0) { this.lives--; this.phase = 'dying'; this.timer = 0.9; this.events.push('lost'); }
  }
  damageEnemy(e: Enemy, damage: number) {
    if (!e.alive || e.spawn > 0) return;
    e.hp -= damage; e.hit = 0.1;
    if (e.hp <= 0) {
      e.alive = false; this.chain = this.elapsed - this.lastKill < 2.5 ? Math.min(3, this.chain + 1) : 1; this.lastKill = this.elapsed;
      this.score += (e.kind === 'armor' ? 250 : 100) * this.chain;
      effect(this.effects, e.x, e.y - 22, 'blast', e.kind === 'armor' ? 40 : 28, 0xffb24f); this.events.push('impact');
    }
  }
  damageProp(prop: Prop, damage: number) {
    if (!prop.alive) return;
    prop.hp -= damage; effect(this.effects, prop.x, prop.y - 24, 'spark', 18, 0xffce73);
    if (prop.hp <= 0) {
      prop.alive = false; this.score += 30; this.events.push('impact');
      if (prop.drop) this.pickups.push({ id: `supply-${prop.id}`, x: prop.x, y: GROUND - 20, kind: prop.drop, active: true });
      if (prop.kind === 'barrel') explode(this, prop.x, prop.y - 20, 100, 8, 'player');
      else effect(this.effects, prop.x, prop.y - 15, 'blast', 30, 0xb99472);
    }
  }
  damageBoss(damage: number) {
    if (!this.boss.active || this.boss.hp <= 0) return;
    this.boss.hp = Math.max(0, this.boss.hp - damage * (this.boss.exposed ? 1 : 0.2));
    if (this.boss.hp === 0) { this.boss.active = false; this.phase = 'bossDefeat'; this.timer = 2.5; this.clearShots(); this.score += 2500; this.events.push('blast'); }
  }
  collect(pickup: Pickup) {
    if (!pickup.active) return;
    pickup.active = false; this.score += 50; this.events.push('pickup');
    if (pickup.kind === 'health') { this.player.health = Math.min(MAX_HEALTH, this.player.health + 2); this.announce('FIELD REPAIR / +2 HEALTH'); }
    else if (pickup.kind === 'grenade') { this.player.grenades = Math.min(9, this.player.grenades + 3); this.announce('BLAST CAPS / +3'); }
    else { this.player.weapon = pickup.kind; this.player.ammo = weapons[pickup.kind].ammo; this.announce(weapons[pickup.kind].name); }
    effect(this.effects, pickup.x, pickup.y, 'spark', 40, 0x56e5d8);
  }
  clearShots() { for (const shot of this.projectiles) shot.active = false; }
  respawn() {
    this.player = createPlayer(this.checkpoint); this.clearShots(); this.phase = 'respawn'; this.timer = 0.8;
    for (const e of this.enemies) if (e.alive) { e.x = Math.max(e.x, this.checkpoint + 300); e.spawn = 1.2; e.timer = 1.2; e.warning = 0; }
    this.boss.warning = 0; this.boss.timer = 2; this.events.push('checkpoint');
  }
}
