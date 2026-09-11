import { test, expect } from '@playwright/test';

const games = ['CIRCUIT BREAK', 'SILLY FISH', 'AIR HOCKEY'];

test('phone screens use available width, readable controls, and an accessible expanded layout', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'PRESS START' })).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile-title-updated.png', fullPage: true });
  await page.getByRole('button', { name: 'PRESS START' }).tap();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-arcade-updated.png', fullPage: true });
  for (const title of games) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).getByRole('button', { name: 'PLAY GAME' }).tap();
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('.game-overlay .primary')).toBeVisible();
    const canvas = (await page.locator('canvas').boundingBox())!;
    expect(canvas.width).toBeGreaterThan(370);
    if (title === 'CIRCUIT BREAK') expect(canvas.height).toBeGreaterThan(500); else expect(canvas.width / canvas.height).toBeCloseTo(title === 'AIR HOCKEY' ? 2 / 3 : title === 'SILLY FISH' ? 3 / 4 : 10 / 7, 2);
    for (const button of await page.locator('.game-toolbar button, .drive-controls button, .game-overlay .primary').all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: 'EXPAND', exact: true }).tap();
    await expect(page.locator('.game-shell')).toHaveAttribute('data-expanded', 'true');
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.setViewportSize({ width: 844, height: 390 });
    await expect.poll(async () => (await page.locator('.game-shell').boundingBox())!.height).toBe(390);
    await expect.poll(async () => { const b = (await page.getByRole('button', { name: 'SHRINK', exact: true }).boundingBox())!; return b.y + b.height; }).toBeLessThanOrEqual(391);
    const stage = (await page.locator('canvas').boundingBox())!;
    const shrink = (await page.getByRole('button', { name: 'SHRINK', exact: true }).boundingBox())!;
    expect(stage.width / stage.height).toBeCloseTo(title === 'AIR HOCKEY' ? 2 / 3 : title === 'SILLY FISH' ? 3 / 4 : 10 / 7, 2);
    expect(stage.y).toBeGreaterThanOrEqual(0); expect(stage.y + stage.height).toBeLessThanOrEqual(391);
    expect(shrink.y + shrink.height).toBeLessThanOrEqual(391);
    const controls = page.locator('.drive-controls');
    if (await controls.count()) expect((await controls.boundingBox())!.x).toBeGreaterThanOrEqual(stage.x + stage.width - 1);
    await page.screenshot({ path: `test-results/mobile-expanded-${title.toLowerCase().replaceAll(' ', '-')}.png` });
    await page.getByRole('button', { name: 'SHRINK', exact: true }).tap();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    await page.getByRole('button', { name: 'BACK TO ARCADE' }).tap();
  }
  expect(errors).toEqual([]); await context.close();
});

test('small phones and desktop play areas preserve proportions without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/'); await page.getByRole('button', { name: 'PRESS START' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('article').filter({ hasText: 'SILLY FISH' }).getByRole('button', { name: 'PLAY GAME' }).click();
  await expect(page.getByRole('button', { name: 'START SWIMMING' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'EXPAND', exact: true }).click();
  await expect(page.getByRole('button', { name: 'SHRINK', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'START SWIMMING' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.game-shell')).toHaveAttribute('data-expanded', 'false');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect.poll(async () => (await page.locator('canvas').boundingBox())!.width).toBeGreaterThan(500);
  await page.screenshot({ path: 'test-results/desktop-larger-game.png', fullPage: true });
});