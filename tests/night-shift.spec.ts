import { test, expect } from '@playwright/test';

test('race model: grid, countdown, controls, AI order, collisions, projection and complete race', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { NightRace } = await import('/src/games/night-shift/model.ts');
    const { trackAt, TRACK_LENGTH, sections, hazards } = await import('/src/games/night-shift/track.ts');
    const { projectRoad, projectAt } = await import('/src/games/night-shift/projection.ts');
    const neutral = { steer: 0, accelerate: false, brake: false };
    const gas = { ...neutral, accelerate: true };
    const race = new NightRace(); const grid = { position: race.position, count: race.racers.length };
    const startDistances = race.racers.map((car: any) => car.distance);
    race.start(); for (let i = 0; i < 120; i++) race.step(1 / 60, gas);
    const frozen = race.player.distance === 0 && race.racers.every((car: any, i: number) => car.distance === startDistances[i]);
    for (let i = 0; i < 62; i++) race.step(1 / 60, neutral);
    const beeps = race.events.filter((event: string) => event === 'beep').length;
    const go = race.events.filter((event: string) => event === 'go').length;
    for (let i = 0; i < 120; i++) race.step(1 / 60, gas);
    const speed = race.player.speed, npcMoved = race.racers.every((car: any, i: number) => car.distance > startDistances[i]);
    race.step(0.05, { ...neutral, steer: 1, brake: true }); const brake = race.player.speed < speed, steered = race.player.lane > 0;
    race.pause(); const pausedDistance = race.player.distance; race.step(0.05, gas); const paused = race.player.distance === pausedDistance; race.pause();
    const impact = new NightRace(); impact.phase = 'racing'; impact.player.speed = 70;
    impact.racers[0].distance = 3; impact.racers[0].lane = 0;
    impact.step(0.016, gas); const hitSpeed = impact.player.speed;
    for (let i = 0; i < 10; i++) impact.step(0.016, gas);
    const impactCount = impact.events.filter((event: string) => event === 'impact').length;
    const hazard = new NightRace(); hazard.phase = 'racing'; hazard.player = { distance: 4478, lane: 0.65, speed: 70 }; hazard.step(0.05, gas);
    const road = new NightRace(); road.phase = 'racing'; road.player = { distance: 3000, lane: 1.2, speed: 70 }; road.step(0.05, gas);
    const ranking = new NightRace(); ranking.player.distance = 80; const overtook = ranking.position < 8;
    const projection = projectRoad(1500, 0); const near = projectAt(projection, 25), far = projectAt(projection, 200);
    const curve = projectRoad(1500, 0), straight = projectRoad(100, 0);
    const curved = Math.abs(projectAt(curve, 300).x - projectAt(straight, 300).x) > 10;
    const complete = new NightRace(); complete.start();
    let maxSpeed = 0, minPosition = 8;
    for (let i = 0; i < 60 * 240 && complete.phase !== 'results'; i++) {
      const p = complete.player, bend = trackAt(p.distance).curve;
      // A simple driver keeps a clear lane and counter-steers the road's centrifugal drift.
      const target = 0.05;
      const steer = Math.max(-1, Math.min(1, (target - p.lane) * 2 + bend * (p.speed / 82) ** 2 * 0.32 / (0.35 + p.speed / 82 * 0.9)));
      complete.step(1 / 60, { steer, accelerate: true, brake: false });
      maxSpeed = Math.max(maxSpeed, complete.player.speed); minPosition = Math.min(minPosition, complete.position);
      complete.events = [];
    }
    const finish = new NightRace(); finish.phase = 'racing'; finish.elapsed = 150; finish.player = { distance: TRACK_LENGTH - 1, lane: 0, speed: 80 };
    finish.racers[0].finishTime = 148; finish.racers[0].distance = TRACK_LENGTH;
    finish.step(0.05, gas); const finalPosition = finish.finalPosition;
    finish.racers[1].distance = TRACK_LENGTH + 100; finish.step(0.05, gas);
    return { grid, frozen, beeps, go, speed, npcMoved, brake, steered, paused, hitSpeed, impactCount,
      hazardHit: hazard.cooldown > 0, offroadSlower: road.player.speed < 70, overtook,
      scaling: near.half > far.half && near.y > far.y, curved,
      complete: { phase: complete.phase, time: complete.finishTime, position: complete.finalPosition },
      maxSpeed, minPosition, finalPosition, stableFinish: finish.finalPosition, trackLength: sections.reduce((sum: number, s: any) => sum + s.length, 0),
      hazardCount: hazards.length, hazardSpacing: hazards.slice(1).every((h: any, i: number) => h.distance - hazards[i].distance >= 180),
      strongerField: race.racers.every((car: any) => car.topSpeed >= 74 && car.acceleration >= 13),
      rearMirrors: Math.abs(projectAt(projectRoad(400, 0.5), 40).x + projectAt(projectRoad(400, 0.5, true), 40).x - 800) < 0.001 };
  });
  expect(result.grid).toEqual({ position: 8, count: 7 }); expect(result.frozen).toBe(true);
  expect(result.beeps).toBe(3); expect(result.go).toBe(1); expect(result.speed).toBeGreaterThan(20);
  expect(result.npcMoved).toBe(true); expect(result.brake).toBe(true); expect(result.steered).toBe(true); expect(result.paused).toBe(true);
  expect(result.hitSpeed).toBeLessThan(50); expect(result.impactCount).toBe(1); expect(result.hazardHit).toBe(true); expect(result.offroadSlower).toBe(true);
  expect(result.overtook).toBe(true); expect(result.scaling).toBe(true); expect(result.curved).toBe(true);
  expect(result.complete.phase).toBe('results'); expect(result.complete.time).toBeGreaterThan(120); expect(result.complete.time).toBeLessThan(180);
  expect(result.maxSpeed).toBeLessThanOrEqual(85); expect(result.minPosition).toBeLessThan(8);
  expect(result.finalPosition).toBe(2); expect(result.stableFinish).toBe(2); expect(result.trackLength).toBe(9900);
  expect(result.hazardCount).toBe(29); expect(result.hazardSpacing).toBe(true); expect(result.strongerField).toBe(true); expect(result.rearMirrors).toBe(true);
});

test('Night Shift browser: staging, flags, countdown, driving, results, storage and cleanup', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, handler: EventListenerOrEventListenerObject, options: any) => { if (type === 'keydown' || type === 'keyup') listeners.add(handler); add(type, handler, options); }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, handler: EventListenerOrEventListenerObject, options: any) => { if (type === 'keydown' || type === 'keyup') listeners.delete(handler); remove(type, handler, options); }) as typeof window.removeEventListener;
    (window as any).raceListeners = listeners;
  });
  await page.route('**/src/games/night-shift/Scene.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nconst originalCreate = NightShiftScene.prototype.create; NightShiftScene.prototype.create = function () { originalCreate.call(this); window.raceScene = this; };\n' });
  });
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
  const baseline = await page.evaluate(() => (window as any).raceListeners.size);
  const play = () => page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'NIGHT SHIFT', exact: true }) }).getByRole('button', { name: 'PLAY GAME' }).click();
  await play(); await expect(page.getByRole('heading', { name: 'ON THE GRID' })).toBeVisible();
  await page.screenshot({ path: 'test-results/night-shift-grid.png', fullPage: true });
  await page.evaluate(() => {
    (window as any).countdowns = [];
    const observer = new MutationObserver(() => { const text = document.querySelector('.game-notice')?.textContent; if (text) (window as any).countdowns.push(text); if (text === 'GO!') observer.disconnect(); });
    observer.observe(document.querySelector('.canvas-wrap')!, { subtree: true, childList: true, characterData: true });
  });
  await page.getByRole('button', { name: 'START RACE' }).click();
  await expect(page.getByText('3', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).raceScene.race.player.distance)).toBe(0);
  await expect.poll(() => page.evaluate(() => (window as any).countdowns.includes('GO!'))).toBe(true);
  const countdown = await page.evaluate(() => (window as any).countdowns);
  expect(countdown).toEqual(expect.arrayContaining(['3', '2', '1', 'GO!']));
  await page.screenshot({ path: 'test-results/night-shift-go.png', fullPage: true });
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(450);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(150); await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowUp');
  const drive = await page.evaluate(() => (window as any).raceScene.race.player);
  expect(drive.speed).toBeGreaterThan(5); expect(drive.lane).toBeGreaterThan(0);
  await page.keyboard.press('p'); await expect(page.getByRole('heading', { name: 'PAUSED.' })).toBeVisible();
  await page.getByRole('button', { name: 'Turn sound on' }).click(); await expect(page.getByRole('button', { name: 'Mute sound' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mute sound' }).click();
  if (await page.evaluate(() => document.fullscreenEnabled)) {
    await page.getByRole('button', { name: 'FULLSCREEN' }).click(); await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await page.getByRole('button', { name: 'FULLSCREEN' }).click();
  }
  await page.getByRole('button', { name: /^RESUME/ }).click();
  await page.evaluate(() => {
    const race = (window as any).raceScene.race;
    race.player = { distance: 1400, lane: 0, speed: 70 }; race.elapsed = 20;
    race.racers.forEach((car: any, i: number) => { car.distance = 1425 + i * 18; });
  });
  await page.screenshot({ path: 'test-results/night-shift-racing.png', fullPage: true });
  await page.evaluate(() => {
    const race = (window as any).raceScene.race;
    race.racers.slice(0, 3).forEach((car: any, i: number) => { car.distance = race.player.distance - 25 - i * 25; });
  });
  await page.keyboard.down('r');
  await expect.poll(() => page.evaluate(() => (window as any).raceScene.rearView)).toBe(true);
  await page.screenshot({ path: 'test-results/night-shift-rear.png', fullPage: true });
  await page.keyboard.up('r');
  await expect.poll(() => page.evaluate(() => (window as any).raceScene.rearView)).toBe(false);
  await page.keyboard.down('r'); await page.keyboard.press('p');
  await expect.poll(() => page.evaluate(() => (window as any).raceScene.rearView)).toBe(false);
  await page.keyboard.up('r'); await page.getByRole('button', { name: /^RESUME/ }).click();
  await page.evaluate(() => {
    const race = (window as any).raceScene.race;
    race.player = { distance: 9899, lane: 0, speed: 80 }; race.elapsed = 145;
    race.racers[0].finishTime = 143; race.racers[0].distance = 9900;
  });
  await expect(page.getByRole('heading', { name: '2ND PLACE' })).toBeVisible();
  await expect(page.getByText(/RACE TIME/)).toBeVisible();
  await page.getByRole('button', { name: 'PLAY AGAIN' }).click();
  expect(await page.evaluate(() => (window as any).raceScene.race.racers.length)).toBe(7);
  expect(await page.evaluate(() => (window as any).raceScene.race.player.distance)).toBe(0);
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.getByRole('button', { name: 'BACK TO ARCADE' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).raceListeners.size)).toBe(baseline);
  for (let i = 0; i < 2; i++) {
    await play(); await expect(page.getByRole('button', { name: 'START RACE' })).toBeVisible();
    await page.getByRole('button', { name: 'BACK TO ARCADE' }).click();
    await expect.poll(() => page.evaluate(() => (window as any).raceListeners.size)).toBe(baseline);
  }
  await page.reload(); await page.getByRole('button', { name: 'PRESS START' }).click();
  await expect(page.getByRole('article').filter({ hasText: 'NIGHT SHIFT' }).getByText('2ND', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('insertcoin:races:night-shift')!).races)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('insertcoin:high:night-shift'))).toBeNull();
  expect(errors).toEqual([]);
});

test('Night Shift touch controls, responsive projection and storage failure handling', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).tap();
  await page.getByRole('article').filter({ hasText: 'NIGHT SHIFT' }).getByRole('button', { name: 'PLAY GAME' }).tap();
  await page.getByRole('button', { name: 'START RACE' }).tap();
  await expect(page.locator('.game-notice')).toHaveCount(0, { timeout: 6000 });
  const gas = page.getByRole('button', { name: 'GAS ↑' });
  await gas.scrollIntoViewIfNeeded(); const rect = (await gas.boundingBox())!;
  const cdp = await context.newCDPSession(page), before = await page.evaluate(() => scrollY);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }] });
  await page.waitForTimeout(500);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.screenshot({ path: 'test-results/night-shift-mobile.png', fullPage: true });
  const canvas = page.locator('canvas'), box = (await canvas.boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(10 / 7, 2);
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect.poll(async () => { const r = (await canvas.boundingBox())!; return r.width / r.height; }).toBeCloseTo(10 / 7, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const stored = await page.evaluate(async () => {
    const { getRaceStats, saveRaceResult } = await import('/src/utils/raceStats.ts');
    localStorage.setItem('insertcoin:races:test-race', '{broken');
    const clean = getRaceStats('test-race'); saveRaceResult('test-race', 150, 3); saveRaceResult('test-race', 140, 1); saveRaceResult('test-race', 160, 7);
    const final = getRaceStats('test-race');
    const original = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('blocked'); };
    const safe = saveRaceResult('test-race', 130, 1); Storage.prototype.setItem = original;
    return { clean, final, safe };
  });
  expect(stored.clean.races).toBe(0); expect(stored.final).toEqual({ bestTime: 140, bestPosition: 1, wins: 1, races: 3 }); expect(stored.safe.bestTime).toBe(130);
  await context.close();
});
