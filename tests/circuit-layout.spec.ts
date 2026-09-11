import { test, expect } from '@playwright/test';
const selectCircuit = async (page: any) => {
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).click();
  await page.getByRole('article').filter({ hasText: 'CIRCUIT BREAK' }).getByRole('button', { name: 'PLAY GAME' }).click();
  await expect(page.getByRole('button', { name: 'LAUNCH BALL' })).toBeVisible();
};

test('Circuit Break opens with the entire board and paddle control visible at phone and desktop sizes', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const [width, height] of [[390, 844], [320, 568], [1440, 1000], [1280, 720], [844, 390]]) {
    await page.setViewportSize({ width, height }); await selectCircuit(page);
    await expect.poll(async () => (await page.locator('canvas').boundingBox())!.y).toBeLessThan(120);
    const box = (await page.locator('canvas').boundingBox())!, slider = (await page.getByRole('slider', { name: 'Move paddle' }).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThan(height);
    expect(slider.y).toBeGreaterThanOrEqual(box.y + box.height - 1); expect(slider.y + slider.height).toBeLessThan(height);
    if (height > 700) expect(box.height).toBeGreaterThan(height * 0.6);
    expect(await page.evaluate(() => scrollY)).toBe(0); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/circuit-layout-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('phone slider moves the actual paddle below the board without scrolling or launching, with working tall-board collisions', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('**/src/games/circuit-break/index.ts*', async route => {
    const response = await route.fetch(); await route.fulfill({ response, body: await response.text() + '\nconst cbCreate = CircuitBreakScene.prototype.create; CircuitBreakScene.prototype.create = function() { cbCreate.call(this); window.cbScene = this; };' });
  });
  await selectCircuit(page);
  const range = page.getByRole('slider', { name: 'Move paddle' });
  const box = (await range.boundingBox())!, cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * 0.82, y: box.y + box.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => (window as any).cbScene.paddleX)).toBeGreaterThan(600);
  expect(await page.evaluate(() => (window as any).cbScene.status)).toBe('ready');
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole('button', { name: 'LAUNCH BALL' }).click();
  const result = await page.evaluate(() => {
    const scene = (window as any).cbScene, height = scene.fieldHeight;
    scene.ball = { x: scene.paddleX, y: height - 66, vx: 0, vy: 350 }; scene.step(0.02);
    const bounced = scene.ball.vy < 0;
    scene.ball.y = height + 1; scene.step(0.001);
    return { height, bounced, lives: scene.lives, restY: scene.ball.y, canvasHeight: scene.game.scale.gameSize.height };
  });
  expect(result.height).toBeGreaterThan(1000); expect(result.canvasHeight).toBe(result.height);
  expect(result.bounced).toBe(true); expect(result.lives).toBe(2); expect(result.restY).toBe(result.height - 69);
  await page.getByRole('button', { name: 'LAUNCH BALL' }).click(); await page.keyboard.press('p');
  await expect(range).toBeDisabled();
  await page.getByRole('button', { name: 'RESTART' }).click(); await expect(range).toHaveValue('50');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => (window as any).cbScene.fieldHeight)).toBe(560);
  expect(await page.evaluate(() => (window as any).cbScene.score)).toBe(0);
  await page.getByRole('button', { name: 'BACK TO ARCADE' }).click(); await expect(page.locator('canvas')).toHaveCount(0);
  await context.close();
});