import { test, expect } from '@playwright/test';

test('title entry, game controls, persistence, navigation and mobile layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'InsertCoin.' })).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'test-results/title-desktop.png', fullPage: true });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'SELECT GAME_' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'CIRCUIT BREAK', exact: true }) }).getByRole('button', { name: 'PLAY GAME' }).click();
  await page.getByRole('button', { name: 'LAUNCH BALL' }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ PAUSE' })).toBeEnabled();
  await page.keyboard.press('p');
  await expect(page.getByRole('heading', { name: 'PAUSED.' })).toBeVisible();
  await page.getByRole('button', { name: /^RESUME/ }).click();
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(300); await page.keyboard.up('ArrowRight');
  await page.getByRole('button', { name: 'RESTART' }).click();
  await expect(page.getByRole('heading', { name: 'READY, PLAYER 01?' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('heading', { name: 'READY, PLAYER 01?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'BACK TO ARCADE' }).click();
  await page.evaluate(() => localStorage.setItem('insertcoin:high:circuit-break', '1200'));
  await page.reload();
  await page.getByRole('button', { name: 'PRESS START' }).click();
  await expect(page.getByText('001200')).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'test-results/arcade-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/arcade-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'CIRCUIT BREAK', exact: true }) }).getByRole('button', { name: 'PLAY GAME' }).click();
  await page.getByRole('button', { name: 'LAUNCH BALL' }).click();
  await page.screenshot({ path: 'test-results/game-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('keyboard paddle movement, touch drag, sound and reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Turn sound on' }).click();
  await expect(page.getByRole('button', { name: 'Mute sound' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'PRESS START' }).tap();
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'CIRCUIT BREAK', exact: true }) }).getByRole('button', { name: 'PLAY GAME' }).tap();
  await expect(page.getByRole('button', { name: 'LAUNCH BALL' })).toBeVisible();
  await page.screenshot({ path: 'test-results/game-ready-mobile.png', fullPage: true });
  const canvas = page.locator('canvas');
  const before = await canvas.screenshot();
  await page.getByRole('application').focus();
  await page.keyboard.down('d'); await page.waitForTimeout(180); await page.keyboard.up('d');
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  await page.getByRole('button', { name: 'LAUNCH BALL' }).tap();
  const bounds = (await canvas.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + 60, y: bounds.y + bounds.height - 24 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bounds.x + 220, y: bounds.y + bounds.height - 24 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByRole('button', { name: 'Ⅱ PAUSE' })).toBeEnabled();
  await page.getByRole('button', { name: 'Ⅱ PAUSE' }).tap();
  await expect(page.getByRole('heading', { name: 'PAUSED.' })).toBeVisible();
  await context.close();
});

test('actual Phaser scene collision, scoring, lives, win and restart', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { CircuitBreakScene } = await import('/src/games/circuit-break/index.ts');
    let current: any;
    const scene = new CircuitBreakScene((state: any) => { current = state; });
    scene.restart(); scene.start();
    scene.ball = { x: 85, y: 70, vx: 0, vy: 350 };
    scene.step(0.02);
    const scored = { ...current };
    scene.ball = { x: 400, y: 490, vx: 0, vy: 350 }; scene.step(0.02);
    const bounced = scene.ball.vy < 0;
    for (let i = 0; i < 3; i++) { scene.start(); scene.ball.y = 561; scene.step(0.001); }
    const lost = { ...current };
    scene.restart(); scene.start();
    scene.blocks.forEach((block: any, i: number) => { block.active = i === 0; });
    scene.ball = { x: 85, y: 70, vx: 0, vy: 350 }; scene.step(0.02);
    const won = { ...current };
    scene.restart();
    return { scored, bounced, lost, won, reset: current, high: localStorage.getItem('insertcoin:high:circuit-break') };
  });
  expect(result.scored.score).toBe(100);
  expect(result.bounced).toBe(true);
  expect(result.lost).toMatchObject({ lives: 0, status: 'over' });
  expect(result.won.status).toBe('won');
  expect(result.reset).toEqual({ score: 0, lives: 3, status: 'ready' });
  expect(result.high).toBe('100');
});




