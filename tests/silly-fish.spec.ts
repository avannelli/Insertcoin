import { test, expect } from '@playwright/test';

test('fish physics: fair collision, one score per pair, capped difficulty and long-run cleanup', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const { FishRun, difficulty, coralRects, intersectsCoral } = await import('/src/games/silly-fish/model.ts');
    const run = new FishRun(() => 0.5);
    run.pairs = [{ x: 109, center: 280, gap: 216, passed: false }];
    run.step(0.01); const firstScore = run.score;
    run.step(0.01); const secondScore = run.score;
    const boundary = new FishRun(); boundary.y = 11; boundary.step(0.001);
    const bottom = new FishRun(); bottom.y = 549; bottom.step(0.001);
    const collision = new FishRun(() => 0.5); collision.pairs[0].x = 170; collision.y = 100; collision.step(0.001);
    const safe = new FishRun(() => 0.5); safe.pairs[0].x = 170; safe.step(0.001);
    const fish = new FishRun(() => 0.5); fish.swim(); const initialVelocity = fish.velocity; fish.step(0.05);
    const infinite = new FishRun(() => 0.5);
    let maxPairs = 0;
    // A simple center-seeking player survives even at the capped difficulty.
    for (let i = 0; i < 60 * 180 && infinite.alive; i++) {
      if (infinite.y > 295 && infinite.velocity > 0) infinite.swim();
      infinite.step(1 / 60); maxPairs = Math.max(maxPairs, infinite.pairs.length);
    }
    const varied = new FishRun(() => 1); let maxShift = 0;
    for (let i = 0; i < 2000; i++) {
      // Isolate procedural generation from player collisions.
      varied.y = 280; varied.velocity = 0; varied.pairs.forEach((pair: any) => { pair.x -= 2; });
      varied.step(0);
      for (let j = 1; j < varied.pairs.length; j++) maxShift = Math.max(maxShift, Math.abs(varied.pairs[j].center - varied.pairs[j - 1].center));
      if (!varied.alive) break;
    }
    const rect = coralRects({ x: 200, center: 280, gap: 216, passed: false })[0];
    return { firstScore, secondScore, topAlive: boundary.alive, bottomAlive: bottom.alive,
      collisionAlive: collision.alive, safeAlive: safe.alive, initialVelocity, swimmingUp: fish.y < 280,
      start: difficulty(0), cap: difficulty(10000), longRunAlive: infinite.alive, longRunScore: infinite.score,
      maxPairs, maxShift, gapSafe: !intersectsCoral(280, rect) };
  });
  expect(results.firstScore).toBe(1); expect(results.secondScore).toBe(1);
  expect(results.topAlive).toBe(false); expect(results.bottomAlive).toBe(false);
  expect(results.collisionAlive).toBe(false); expect(results.safeAlive).toBe(true);
  expect(results.initialVelocity).toBe(-285); expect(results.swimmingUp).toBe(true);
  expect(results.start).toEqual({ speed: 155, gap: 216 }); expect(results.cap).toEqual({ speed: 230, gap: 174 });
  expect(results.longRunAlive).toBe(true); expect(results.longRunScore).toBeGreaterThan(100);
  expect(results.maxPairs).toBeLessThanOrEqual(4); expect(results.maxShift).toBeLessThanOrEqual(75);
  expect(results.gapSafe).toBe(true);
});

test('fish shell: controls, pause, restart, records, sound and repeated mount cleanup', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const originalAdd = window.addEventListener.bind(window), originalRemove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, callback: EventListenerOrEventListenerObject, options: any) => {
      if (type === 'keydown') listeners.add(callback); originalAdd(type, callback, options);
    }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, callback: EventListenerOrEventListenerObject, options: any) => {
      if (type === 'keydown') listeners.delete(callback); originalRemove(type, callback, options);
    }) as typeof window.removeEventListener;
    (window as any).keydownListeners = listeners;
  });
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).click();
  const baseline = await page.evaluate(() => (window as any).keydownListeners.size);
  const play = () => page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'SILLY FISH', exact: true }) }).getByRole('button', { name: 'PLAY GAME' }).click();
  await play();
  await expect(page.getByText('SPACE / ↑ / CLICK / TAP TO SWIM', { exact: true })).toBeVisible();
  await expect(page.getByLabel('1 lives remaining')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Ⅱ PAUSE' })).toBeEnabled();
  await page.keyboard.press('p'); await expect(page.getByRole('heading', { name: 'PAUSED.' })).toBeVisible();
  await page.getByRole('button', { name: /^RESUME/ }).click();
  await page.keyboard.press('ArrowUp');
  await page.locator('canvas').click({ position: { x: 200, y: 200 } });
  await page.getByRole('button', { name: 'Ⅱ PAUSE' }).click();
  await page.getByRole('button', { name: 'Turn sound on' }).click();
  await expect(page.getByRole('button', { name: 'Mute sound' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await page.getByRole('button', { name: 'RESTART' }).click();
  await expect(page.getByRole('heading', { name: 'READY TO GET SILLY?' })).toBeVisible();
  await page.getByRole('button', { name: 'START SWIMMING' }).click();
  await expect(page.getByRole('heading', { name: 'GAME OVER.' })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('FINAL SCORE / 000000')).toBeVisible();
  await expect(page.getByText('BEST')).toBeVisible();
  await page.getByRole('button', { name: 'PLAY AGAIN' }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.getByRole('button', { name: 'BACK TO ARCADE' }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as any).keydownListeners.size)).toBe(baseline);
  for (let i = 0; i < 3; i++) {
    await play(); await expect(page.getByRole('button', { name: 'START SWIMMING' })).toBeVisible();
    await page.getByRole('button', { name: 'RESTART' }).click();
    await expect(page.locator('canvas')).toHaveCount(1);
    await page.getByRole('button', { name: 'BACK TO ARCADE' }).click();
    await expect.poll(() => page.evaluate(() => (window as any).keydownListeners.size)).toBe(baseline);
  }
  await page.evaluate(async () => { const { saveHighScore } = await import('/src/utils/scores.ts'); saveHighScore('silly-fish', 17); saveHighScore('silly-fish', 3); });
  await page.reload(); await page.getByRole('button', { name: 'PRESS START' }).click();
  await expect(page.getByText('000017')).toBeVisible();
  expect(errors).toEqual([]);
});

test('fish mobile touch and focused arrows do not scroll', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).tap();
  await page.getByRole('article').filter({ hasText: 'SILLY FISH' }).getByRole('button', { name: 'PLAY GAME' }).tap();
  await page.getByRole('button', { name: 'START SWIMMING' }).tap();
  await page.locator('canvas').tap({ position: { x: 100, y: 120 } });
  const scroll = await page.evaluate(() => scrollY);
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('Space');
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await page.screenshot({ path: 'test-results/silly-fish-mobile.png', fullPage: true });
  await page.keyboard.press('p'); await expect(page.getByRole('heading', { name: 'PAUSED.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
