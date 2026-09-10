import { test, expect } from '@playwright/test';

test('hockey physics: fast hits, walls, goals, match rules and fair bounded AI', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { HockeyMatch, MAX_PUCK_SPEED } = await import('/src/games/air-hockey/model.ts');
    const running = () => { const m = new HockeyMatch(() => 0.5); m.phase = 'playing'; return m; };
    const hit = running(); hit.puck = { x: 240, y: 525, vx: 0, vy: MAX_PUCK_SPEED }; hit.step(0.05);
    const hitUp = hit.puck.vy < 0;
    const wall = running(); wall.puck = { x: 438, y: 450, vx: 1050, vy: 0 }; wall.step(0.05);
    const wallBounced = wall.puck.vx < 0 && wall.puck.x < 451;
    const blocked = running(); blocked.puck = { x: 100, y: 40, vx: 0, vy: -1050 }; blocked.step(0.05);
    const goalBlocked = blocked.playerScore === 0 && blocked.puck.vy > 0;
    const goal = running(); goal.puck = { x: 240, y: 0, vx: 0, vy: -400 }; goal.step(0.02);
    const partial = goal.playerScore; goal.step(0.02); const once = goal.playerScore;
    for (let i = 0; i < 10; i++) goal.step(0.02);
    const noDuplicate = goal.playerScore;
    const goalPhase = goal.phase;
    goal.pause(); const frozen = goal.remaining; goal.step(0.05); const pauseFrozen = goal.remaining === frozen;
    goal.pause(); for (let i = 0; i < 100; i++) goal.step(0.02);
    const resumed = goal.phase;
    const win = running(); win.playerScore = 6; win.puck = { x: 240, y: -10, vx: 0, vy: -400 }; win.step(0.02);
    for (let i = 0; i < 10; i++) win.step(0.05);
    const loss = running(); loss.cpuScore = 6; loss.puck = { x: 240, y: 730, vx: 0, vy: 400 }; loss.step(0.02);
    const limits = running(); limits.setTarget(-100, -100); for (let i = 0; i < 20; i++) limits.step(0.02);
    const constrained = limits.player.x >= 46 && limits.player.y >= 389 && limits.cpu.y <= 329;
    const pinch = running(); pinch.player = { x: 46, y: 600, vx: 0, vy: 0 }; pinch.target = { x: 46, y: 600 }; pinch.puck = { x: 29, y: 600, vx: -100, vy: 0 }; pinch.step(0.02);
    const released = Math.hypot(pinch.puck.x - pinch.player.x, pinch.puck.y - pinch.player.y) >= 36.8;
    const fast = running(); fast.puck = { x: 240, y: 360, vx: 1050, vy: 300 }; let maxSpeed = 0, finite = true;
    for (let i = 0; i < 3000; i++) {
      fast.setTarget(240 + Math.sin(i * 0.03) * 190, 570 + Math.cos(i * 0.02) * 90); fast.step(1 / 60); fast.events = [];
      maxSpeed = Math.max(maxSpeed, Math.hypot(fast.puck.vx, fast.puck.vy));
      finite &&= [fast.puck.x, fast.puck.y, fast.puck.vx, fast.puck.vy].every(Number.isFinite);
      if (fast.phase === 'won' || fast.phase === 'over') break;
    }
    // A simple attacking controller can score against this CPU; it is not a perfect goalie.
    const spar = new HockeyMatch(() => 0.5); spar.start(); let cpuMaxMove = 0;
    for (let i = 0; i < 18000 && spar.phase !== 'won' && spar.phase !== 'over'; i++) {
      const oldX = spar.cpu.x, oldY = spar.cpu.y, oldPhase = spar.phase;
      spar.setTarget(spar.puck.x + 8, spar.puck.y > 370 ? spar.puck.y + 35 : 590);
      spar.step(1 / 60); spar.events = [];
      if (oldPhase === 'playing' && spar.phase === 'playing') cpuMaxMove = Math.max(cpuMaxMove, Math.hypot(spar.cpu.x - oldX, spar.cpu.y - oldY));
    }
    return { hitUp, wallBounced, goalBlocked, partial, once, noDuplicate, goalPhase, pauseFrozen, resumed,
      win: { phase: win.phase, score: win.playerScore, events: win.events.filter((e: string) => e === 'win').length },
      loss: loss.phase, constrained, released, maxSpeed, finite, spar: [spar.playerScore, spar.cpuScore], cpuMaxMove };
  });
  expect(result.hitUp).toBe(true); expect(result.wallBounced).toBe(true); expect(result.goalBlocked).toBe(true);
  expect(result.partial).toBe(0); expect(result.once).toBe(1); expect(result.noDuplicate).toBe(1);
  expect(result.goalPhase).toBe('goal'); expect(result.pauseFrozen).toBe(true); expect(['countdown', 'playing']).toContain(result.resumed);
  expect(result.win).toEqual({ phase: 'won', score: 7, events: 1 }); expect(result.loss).toBe('over');
  expect(result.constrained).toBe(true); expect(result.released).toBe(true); expect(result.finite).toBe(true);
  expect(result.maxSpeed).toBeLessThanOrEqual(1050.001); expect(result.cpuMaxMove).toBeLessThanOrEqual(335 / 60 + 0.01);
  expect(result.spar[0]).toBeGreaterThan(0);
});

test('Air Hockey mounts through registry, inputs, fullscreen, stats, restart and cleanup', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, handler: EventListenerOrEventListenerObject, options: any) => {
      if (type === 'keydown' || type === 'keyup') listeners.add(handler); add(type, handler, options);
    }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, handler: EventListenerOrEventListenerObject, options: any) => {
      if (type === 'keydown' || type === 'keyup') listeners.delete(handler); remove(type, handler, options);
    }) as typeof window.removeEventListener;
    (window as any).hockeyListeners = listeners;
  });
  // Capture the real mounted scene in this test only, to assert input coordinates
  // and finish matches without waiting for fourteen naturally occurring goals.
  // Intercept the module actually requested by Vite, including its HMR timestamp.
  await page.route('**/src/games/air-hockey/Scene.ts*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({ response, body: source + '\nconst originalCreate = AirHockeyScene.prototype.create; AirHockeyScene.prototype.create = function () { originalCreate.call(this); window.hockeyScene = this; };\n' });
  });
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
  const baseline = await page.evaluate(() => (window as any).hockeyListeners.size);
  const play = () => page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'AIR HOCKEY', exact: true }) }).getByRole('button', { name: 'PLAY GAME' }).click();
  await play(); await expect(page.getByRole('heading', { name: 'FIRST TO 7' })).toBeVisible();
  await expect(page.getByLabel('PLAYER 0 — 0 CPU', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as any).countdownSeen = [];
    const observer = new MutationObserver(() => {
      const label = document.querySelector('.game-notice')?.textContent;
      if (label) (window as any).countdownSeen.push(label);
      if (label === 'GO!') observer.disconnect();
    });
    observer.observe(document.querySelector('.canvas-wrap')!, { subtree: true, childList: true, characterData: true });
  });
  await page.getByRole('button', { name: 'START MATCH' }).click();
  await expect(page.getByText('READY', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).countdownSeen.includes('GO!'))).toBe(true);
  await expect(page.locator('.game-notice')).toHaveCount(0);
  const canvas = page.locator('canvas'), bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * 0.3, bounds.y + bounds.height * 0.8);
  await expect.poll(() => page.evaluate(() => (window as any).hockeyScene.match.player.x)).toBeLessThan(170);
  const beforeKey = await page.evaluate(() => (window as any).hockeyScene.match.player.x);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(150); await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => (window as any).hockeyScene.match.player.x)).toBeGreaterThan(beforeKey + 30);
  await page.keyboard.press('p'); await expect(page.getByRole('heading', { name: 'PAUSED.' })).toBeVisible();
  await page.getByRole('button', { name: 'Turn sound on' }).click();
  await expect(page.getByRole('button', { name: 'Mute sound' })).toHaveAttribute('aria-pressed', 'true');
  if (await page.evaluate(() => document.fullscreenEnabled)) {
    await page.getByRole('button', { name: 'FULLSCREEN' }).click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await page.getByRole('button', { name: 'FULLSCREEN' }).click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  }
  await page.getByRole('button', { name: 'RESTART' }).click();
  await expect(page.getByRole('heading', { name: 'FIRST TO 7' })).toBeVisible();
  await page.screenshot({ path: 'test-results/air-hockey-desktop.png', fullPage: true });
  await expect(canvas).toHaveCount(1);
  await page.evaluate(() => {
    const m = (window as any).hockeyScene.match;
    m.phase = 'playing'; m.playerScore = 6; m.cpuScore = 3;
    m.puck = { x: 240, y: -10, vx: 0, vy: -400 };
  });
  await expect(page.getByRole('heading', { name: 'YOU WIN', exact: true })).toBeVisible();
  await expect(page.getByText('FINAL / PLAYER 7 — 3 CPU')).toBeVisible();
  await expect(page.getByLabel('1 wins, 0 losses, best goal differential 4')).toBeVisible();
  await page.getByRole('button', { name: 'PLAY AGAIN' }).click();
  await page.evaluate(() => {
    const m = (window as any).hockeyScene.match;
    m.phase = 'playing'; m.playerScore = 5; m.cpuScore = 6;
    m.puck = { x: 240, y: 730, vx: 0, vy: 400 };
  });
  await expect(page.getByRole('heading', { name: 'CPU WINS', exact: true })).toBeVisible();
  await expect(page.getByText('FINAL / PLAYER 5 — 7 CPU')).toBeVisible();
  await page.getByRole('button', { name: 'PLAY AGAIN' }).click();
  await page.getByRole('button', { name: 'BACK TO ARCADE' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).hockeyListeners.size)).toBe(baseline);
  for (let i = 0; i < 3; i++) {
    await play(); await expect(page.getByRole('button', { name: 'START MATCH' })).toBeVisible();
    await page.getByRole('button', { name: 'RESTART' }).click(); await expect(canvas).toHaveCount(1);
    await page.getByRole('button', { name: 'BACK TO ARCADE' }).click();
    await expect.poll(() => page.evaluate(() => (window as any).hockeyListeners.size)).toBe(baseline);
  }
  await expect(canvas).toHaveCount(0);
  await page.reload(); await page.getByRole('button', { name: 'PRESS START' }).click();
  await expect(page.getByLabel('1 wins, 1 losses, best goal differential 4')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('insertcoin:high:air-hockey'))).toBeNull();
  expect(errors).toEqual([]);
});

test('Air Hockey touch controls and portrait scaling', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).tap();
  await page.getByRole('article').filter({ hasText: 'AIR HOCKEY' }).getByRole('button', { name: 'PLAY GAME' }).tap();
  await page.getByRole('button', { name: 'START MATCH' }).tap();
  await expect(page.locator('.game-notice')).toHaveCount(0, { timeout: 3000 });
  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded(); const box = (await canvas.boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(2 / 3, 2);
  const cdp = await context.newCDPSession(page);
  const y = box.y + box.height * 0.8;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 100, y }] });
  const before = await page.evaluate(() => scrollY);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + 220, y: y - 30 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.keyboard.press('p'); await expect(page.getByRole('heading', { name: 'PAUSED.' })).toBeVisible();
  await page.getByRole('button', { name: /^RESUME/ }).click();
  await page.screenshot({ path: 'test-results/air-hockey-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 820, height: 1180 });
  const resized = (await canvas.boundingBox())!; expect(resized.width / resized.height).toBeCloseTo(2 / 3, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

