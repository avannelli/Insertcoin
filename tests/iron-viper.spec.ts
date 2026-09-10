import { test, expect } from '@playwright/test';

test('Iron Viper movement, aiming, limited ammo, explosions and collision ownership', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { IronViperRun } = await import('/src/games/iron-viper/model.ts');
    const { idleInput } = await import('/src/games/iron-viper/config.ts');
    const { createEnemy } = await import('/src/games/iron-viper/enemies.ts');
    const { shoot, explode, stepProjectiles } = await import('/src/games/iron-viper/combat.ts');
    const { fire } = await import('/src/games/iron-viper/entities.ts');
    const r = new IronViperRun(); r.phase = 'playing'; const input = idleInput();
    for (let i = 0; i < 30; i++) r.update(1 / 120, { ...input, move: 1 });
    const moved = r.player.x > 120;
    r.update(1 / 120, { ...input, jump: true }); const jumped = r.player.vy < 0;
    for (let i = 0; i < 150; i++) r.update(1 / 120, input);
    const landed = r.player.grounded && r.player.y === 442;
    r.update(1 / 120, { ...input, crouch: true }); const crouched = r.player.crouching;
    r.clearShots(); r.player.fireCooldown = 0; shoot(r, { ...input, up: true });
    const up = r.projectiles.find((s: any) => s.active)!; const upward = up.vy < -600 && Math.abs(up.vx) < 1;
    r.clearShots(); r.player.weapon = 'fan'; r.player.ammo = 1; r.player.fireCooldown = 0; shoot(r, input);
    const ammo = { count: r.projectiles.filter((s: any) => s.active).length, weapon: r.player.weapon, ammo: r.player.ammo };
    r.clearShots(); r.player.x = 100; r.player.invulnerable = 0;
    const e = createEnemy('target', 'rifle', 180); e.spawn = 0; r.enemies = [e];
    fire(r.projectiles, { x: 150, y: 419, vx: 800, vy: 0, radius: 3, damage: 1, life: 2, team: 'enemy', kind: 'bullet' });
    stepProjectiles(r, 0.05); const noFriendlyFire = e.hp === 3;
    r.clearShots(); fire(r.projectiles, { x: 140, y: 419, vx: 1400, vy: 0, radius: 3, damage: 1, life: 2, team: 'player', kind: 'bullet' });
    stepProjectiles(r, 0.05); const swept = e.hp === 2 && !r.projectiles.some((s: any) => s.active);
    const other = createEnemy('other', 'armor', 220); other.spawn = 0; r.enemies.push(other);
    explode(r, 190, 418, 100, 8, 'player'); const score = r.score;
    r.damageEnemy(e, 30); const noDuplicateScore = r.score === score;
    const aoe = !e.alive && other.hp === 2 && r.player.health === 5;
    const supply = r.props[0]; r.damageProp(supply, 100); const pickup = r.pickups[0]; r.collect(pickup); const collected = r.score; r.collect(pickup); r.damageProp(supply, 100);
    return { moved, jumped, landed, crouched, upward, ammo, noFriendlyFire, swept, noDuplicateScore, aoe, once: r.score === collected, pickupWeapon: r.player.weapon };
  });
  expect(result).toMatchObject({ moved: true, jumped: true, landed: true, crouched: true, upward: true, noFriendlyFire: true, swept: true, noDuplicateScore: true, aoe: true, once: true, pickupWeapon: 'coil' });
  expect(result.ammo).toEqual({ count: 3, weapon: 'pulse', ammo: -1 });
});

test('Iron Viper health, checkpoints, bounded continues, pause, vehicle and boss phases', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { IronViperRun } = await import('/src/games/iron-viper/model.ts');
    const { idleInput } = await import('/src/games/iron-viper/config.ts');
    const { updateBoss } = await import('/src/games/iron-viper/boss.ts');
    const input = idleInput(), r = new IronViperRun(); r.phase = 'playing'; r.player.invulnerable = 0;
    r.damagePlayer(); r.damagePlayer(); const invulnerability = r.player.health === 4;
    r.checkpoint = 1810; r.sectorIndex = 1; r.score = 444; r.player.health = 1; r.player.invulnerable = 0; r.damagePlayer();
    for (let i = 0; i < 250; i++) r.update(1 / 120, input);
    const checkpoint = [r.player.x, r.player.health, r.lives, r.score];
    const x = r.player.x; r.pause(); for (let i = 0; i < 100; i++) r.update(1 / 120, { ...input, move: 1 }); const frozen = r.player.x === x; r.pause();
    const die = () => { r.phase = 'playing'; r.lives = 1; r.player.health = 1; r.player.invulnerable = 0; r.damagePlayer(); for (let i = 0; i < 120; i++) r.update(1 / 120, input); };
    die(); const offered = r.phase; r.start(); const continued = [r.lives, r.continues, r.player.x, r.score];
    die(); r.start(); die(); const exhausted = r.phase;
    const timeout = new IronViperRun(); timeout.phase = 'continue'; timeout.timer = 9; for (let i = 0; i < 1100; i++) timeout.update(1 / 120, input);
    const v = new IronViperRun(); v.phase = 'playing'; v.sectorIndex = 4; v.player.x = 7240; v.vehicle({ ...input, up: true }); const mounted = v.player.vehicle;
    v.player.invulnerable = 0; v.damagePlayer(); const vehicleHit = v.player.vehicleHealth === 7 && v.player.health === 5;
    v.player.x = 8820; v.vehicle(input); const exited = !v.player.vehicle;
    const b = new IronViperRun(); b.phase = 'playing'; b.boss.active = true; b.player.x = 9900;
    const phases: number[] = [], patterns: string[][] = [];
    for (const hp of [150, 90, 40]) { b.boss.hp = hp; b.boss.timer = 0; b.boss.warning = 0; b.clearShots(); for (let i = 0; i < 145; i++) updateBoss(b.boss, b.player, b.projectiles, 1 / 120); phases.push(b.boss.phase); patterns.push(b.projectiles.filter((s: any) => s.active).map((s: any) => s.kind)); }
    b.boss.exposed = true; b.damageBoss(500); const killScore = b.score; b.damageBoss(500); const once = b.score === killScore;
    for (let i = 0; i < 500; i++) b.update(1 / 120, input); const wonScore = b.score; for (let i = 0; i < 500; i++) b.update(1 / 120, input);
    return { invulnerability, checkpoint, frozen, offered, continued, exhausted, timeout: timeout.phase, mounted, vehicleHit, exited, phases, patterns, once, phase: b.phase, finishOnce: wonScore === b.score && b.events.filter((e: string) => e === 'win').length === 1 };
  });
  expect(result.invulnerability).toBe(true); expect(result.checkpoint).toEqual([1810, 5, 2, 444]); expect(result.frozen).toBe(true);
  expect(result.offered).toBe('continue'); expect(result.continued).toEqual([3, 1, 1810, 444]); expect(result.exhausted).toBe('over'); expect(result.timeout).toBe('over');
  expect(result.mounted && result.vehicleHit && result.exited).toBe(true); expect(result.phases).toEqual([1, 2, 3]);
  expect(result.patterns.map(p => p.length)).toEqual([3, 2, 5]); expect(result.patterns[1]).toEqual(['shell', 'shell']);
  expect(result.once && result.finishOnce).toBe(true); expect(result.phase).toBe('complete');
});

test('Iron Viper full encounter progression has fair arrivals and bounded pools', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { IronViperRun } = await import('/src/games/iron-viper/model.ts');
    const { idleInput } = await import('/src/games/iron-viper/config.ts');
    const { pits } = await import('/src/games/iron-viper/level.ts');
    const r = new IronViperRun(); r.phase = 'playing'; let maxEnemies = 0, minSpawnDistance = Infinity, finite = true; const seen = new Set<string>();
    // Exercise real wave scheduling, movement, platforms, hazards, checkpoints and
    // bounded allocation over a complete level. Combat is covered separately.
    for (let i = 0; i < 120 * 420 && r.phase !== 'complete'; i++) {
      r.player.invulnerable = 1;
      const input = { ...idleInput(), move: 1, fire: true, up: r.sectorIndex === 4 && !r.vehicleClaimed, jump: r.player.grounded && pits.some((pit: any) => pit.x - r.player.x > 0 && pit.x - r.player.x < 60) };
      r.update(1 / 120, input);
      for (const e of r.enemies) {
        if (!seen.has(e.id)) { seen.add(e.id); minSpawnDistance = Math.min(minSpawnDistance, Math.abs(e.x - r.player.x)); }
        if (e.spawn <= 0) r.damageEnemy(e, 100);
      }
      if (r.boss.active && i % 120 === 0) r.damageBoss(5);
      maxEnemies = Math.max(maxEnemies, r.enemies.length); finite &&= Number.isFinite(r.player.x) && Number.isFinite(r.player.y);
      r.events.length = 0;
    }
    return { phase: r.phase, sector: r.sectorIndex, elapsed: r.elapsed, enemyCount: seen.size, maxEnemies, minSpawnDistance, finite, shots: r.projectiles.length, effects: r.effects.length, vehicleClaimed: r.vehicleClaimed };
  });
  expect(result.phase).toBe('complete'); expect(result.sector).toBe(5); expect(result.enemyCount).toBe(73);
  expect(result.maxEnemies).toBeLessThanOrEqual(11); expect(result.minSpawnDistance).toBeGreaterThanOrEqual(270);
  expect(result.finite && result.vehicleClaimed).toBe(true); expect(result.shots).toBe(180); expect(result.effects).toBe(90);
  expect(result.elapsed).toBeGreaterThan(210); expect(result.elapsed).toBeLessThan(360);
});

test('Iron Viper actual weapons can clear every encounter and boss in one short run', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { IronViperRun } = await import('/src/games/iron-viper/model.ts');
    const { idleInput } = await import('/src/games/iron-viper/config.ts');
    const { pits } = await import('/src/games/iron-viper/level.ts');
    const r = new IronViperRun(); r.phase = 'playing'; const visited = new Set<number>();
    // Invulnerability isolates combat reachability from this simple bot's lack
    // of dodging. Enemy/prop/boss damage comes exclusively from real projectiles.
    for (let i = 0; i < 120 * 360 && r.phase !== 'complete'; i++) {
      const p = r.player; p.invulnerable = 1;
      const input = { ...idleInput(), move: 1, fire: true };
      const e = r.enemies.filter((e: any) => e.alive).sort((a: any, b: any) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      if (e) {
        const dx = e.x - p.x, elevated = e.kind === 'drone' || e.kind === 'elevated';
        input.move = Math.abs(dx) > (elevated ? 12 : 220) || p.facing !== Math.sign(dx) ? Math.sign(dx) : 0;
        input.up = elevated && Math.abs(dx) < 18;
        if (!elevated && p.y < 420) input.move = 1;
      }
      if (r.sectorIndex === 4 && !r.vehicleClaimed && Math.abs(p.x - 7240) < 70) input.up = true;
      if (r.boss.active) { input.move = p.x < 10050 ? 1 : 0; input.up = false; }
      input.jump = p.grounded && pits.some((pit: any) => input.move > 0 ? pit.x - p.x > 0 && pit.x - p.x < 60 : p.x - pit.x - pit.width > 0 && p.x - pit.x - pit.width < 60);
      r.update(1 / 120, input); visited.add(r.sectorIndex); r.events.length = 0;
    }
    return { phase: r.phase, elapsed: r.elapsed, score: r.score, visited: visited.size, boss: r.boss.hp };
  });
  expect(result.phase).toBe('complete'); expect(result.visited).toBe(6); expect(result.boss).toBe(0);
  expect(result.elapsed).toBeGreaterThan(240); expect(result.elapsed).toBeLessThan(360); expect(result.score).toBeGreaterThan(15000);
});

test('Iron Viper browser controls, continue, boss victory, records, resize and cleanup', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    const listeners = new Set<unknown>(), add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, handler: any, options: any) => { if (['keydown', 'keyup', 'blur'].includes(type)) listeners.add(handler); add(type, handler, options); }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, handler: any, options: any) => { if (['keydown', 'keyup', 'blur'].includes(type)) listeners.delete(handler); remove(type, handler, options); }) as typeof window.removeEventListener;
    (window as any).viperListeners = listeners;
  });
  await page.route('**/src/games/iron-viper/Scene.ts*', async route => {
    const response = await route.fetch(); await route.fulfill({ response, body: await response.text() + '\nconst createViper = IronViperScene.prototype.create; IronViperScene.prototype.create = function() { createViper.call(this); window.viperScene = this; };' });
  });
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).click();
  await expect(page.getByRole('article')).toHaveCount(5); const baseline = await page.evaluate(() => (window as any).viperListeners.size);
  const play = () => page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'IRON VIPER', exact: true }) }).getByRole('button', { name: 'PLAY GAME' }).click();
  await play(); await expect(page.getByRole('button', { name: 'START MISSION' })).toBeVisible();
  await page.screenshot({ path: 'test-results/iron-viper-ready.png', fullPage: true });
  await page.getByRole('button', { name: 'START MISSION' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).viperScene.run.phase)).toBe('playing');
  const scroll = await page.evaluate(() => scrollY);
  await page.keyboard.down('d'); await page.keyboard.down('z'); await page.waitForTimeout(500); await page.keyboard.up('d'); await page.keyboard.up('z');
  expect(await page.evaluate(() => (window as any).viperScene.run.player.x)).toBeGreaterThan(150);
  await page.keyboard.down('Space'); await page.waitForTimeout(100); expect(await page.evaluate(() => (window as any).viperScene.run.player.y)).toBeLessThan(420); await page.keyboard.up('Space');
  await page.waitForTimeout(900); await page.keyboard.down('s'); await expect.poll(() => page.evaluate(() => (window as any).viperScene.run.player.crouching)).toBe(true); await page.keyboard.up('s');
  await page.keyboard.press('x'); await expect.poll(() => page.evaluate(() => (window as any).viperScene.run.player.grenades)).toBe(3);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await page.screenshot({ path: 'test-results/iron-viper-playing.png', fullPage: true });
  await page.keyboard.press('p'); await expect(page.getByRole('heading', { name: 'PAUSED.' })).toBeVisible();
  await page.getByRole('button', { name: 'Turn sound on' }).click(); await page.getByRole('button', { name: 'Mute sound' }).click();
  if (await page.evaluate(() => document.fullscreenEnabled)) { await page.getByRole('button', { name: 'FULLSCREEN' }).click(); await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true); await page.getByRole('button', { name: 'FULLSCREEN' }).click(); }
  await page.getByRole('button', { name: /^RESUME/ }).click();
  await page.evaluate(() => { const r = (window as any).viperScene.run; r.phase = 'continue'; r.timer = 9; r.lives = 0; r.score = 1234; });
  await expect(page.getByRole('heading', { name: /CONTINUE\?/ })).toBeVisible(); await page.getByRole('button', { name: /^CONTINUE/ }).click();
  await expect.poll(() => page.evaluate(() => (window as any).viperScene.run.lives)).toBe(3);
  await page.evaluate(() => { const r = (window as any).viperScene.run; r.phase = 'playing'; r.sectorIndex = 5; r.player.x = 9950; r.player.invulnerable = 10; r.boss.active = true; r.boss.hp = 40; });
  await page.screenshot({ path: 'test-results/iron-viper-boss.png', fullPage: true });
  await page.evaluate(() => { const r = (window as any).viperScene.run; r.boss.exposed = true; r.damageBoss(500); });
  await expect(page.getByRole('heading', { name: 'MISSION COMPLETE' })).toBeVisible();
  const high = await page.evaluate(() => localStorage.getItem('insertcoin:high:iron-viper'));
  expect(Number(high)).toBeGreaterThan(10000);
  await page.getByRole('button', { name: 'PLAY AGAIN' }).click(); await expect(page.locator('canvas')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/iron-viper-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = (await page.locator('canvas').boundingBox())!; expect(box.width / box.height).toBeCloseTo(10 / 7, 2);
  await page.getByRole('button', { name: 'BACK TO ARCADE' }).click(); await expect.poll(() => page.evaluate(() => (window as any).viperListeners.size)).toBe(baseline);
  for (let i = 0; i < 2; i++) { await play(); await expect(page.getByRole('button', { name: 'START MISSION' })).toBeVisible(); await page.getByRole('button', { name: 'RESTART' }).click(); await page.getByRole('button', { name: 'BACK TO ARCADE' }).click(); await expect.poll(() => page.evaluate(() => (window as any).viperListeners.size)).toBe(baseline); }
  await page.reload(); await page.getByRole('button', { name: 'PRESS START' }).click();
  await expect(page.getByRole('article').filter({ hasText: 'IRON VIPER' }).getByText(String(high).padStart(6, '0'))).toBeVisible(); expect(errors).toEqual([]);
});

test('Iron Viper simultaneous touch controls release cleanly without page scrolling', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('**/src/games/iron-viper/Scene.ts*', async route => {
    const response = await route.fetch(); await route.fulfill({ response, body: await response.text() + '\nconst touchCreate = IronViperScene.prototype.create; IronViperScene.prototype.create = function() { touchCreate.call(this); window.viperScene = this; };' });
  });
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).tap();
  await page.getByRole('article').filter({ hasText: 'IRON VIPER' }).getByRole('button', { name: 'PLAY GAME' }).tap();
  await page.getByRole('button', { name: 'START MISSION' }).tap();
  await expect.poll(() => page.evaluate(() => (window as any).viperScene.run.phase)).toBe('playing');
  const controls = page.getByLabel('Touch game controls'); await controls.scrollIntoViewIfNeeded();
  const right = (await page.getByRole('button', { name: 'RIGHT →', exact: true }).boundingBox())!, fire = (await page.getByRole('button', { name: 'FIRE', exact: true }).boundingBox())!;
  const cdp = await context.newCDPSession(page), scroll = await page.evaluate(() => scrollY);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: right.x + right.width / 2, y: right.y + right.height / 2, id: 1 }, { x: fire.x + fire.width / 2, y: fire.y + fire.height / 2, id: 2 }] });
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => { const r = (window as any).viperScene.run; return { x: r.player.x, shots: r.projectiles.filter((s: any) => s.active && s.team === 'player').length }; });
  expect(state.x).toBeGreaterThan(150); expect(state.shots).toBeGreaterThan(0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(150); expect(await page.evaluate(() => (window as any).viperScene.run.player.vx)).toBe(0);
  expect(await page.evaluate(() => scrollY)).toBe(scroll); await context.close();
});
