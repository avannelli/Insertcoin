import { test, expect } from '@playwright/test';
test('ball reflects off paddle and blocks by the face it struck, without sticking or going flat', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { CircuitBreakScene } = await import('/src/games/circuit-break/index.ts');
    const make = () => { const s = new CircuitBreakScene(() => {}); s.restart(); s.start(); return s; };
    const out: any = {};

    // 1. paddle still reflects like a wall
    const a = make(); a.paddleX = 400;
    a.ball = { x: 400, y: a.fieldHeight - 66, vx: 240, vy: 330 };
    a.step(0.02);
    out.paddle = { vx: a.ball.vx, vy: a.ball.vy };

    // 2. ball arriving at the paddle's side no longer passes through it
    const b = make(); b.paddleX = 400;
    b.ball = { x: 400 - 63 - 8, y: b.fieldHeight - 58, vx: 300, vy: 0 };
    b.step(0.02);
    out.side = { x: b.ball.x, vx: b.ball.vx };

    // 3. a block struck from the side flips X, not Y
    const c = make();
    c.blocks.forEach((bl: any, i: number) => { bl.active = i === 0; });
    const block = c.blocks[0];
    c.ball = { x: block.x - 8, y: block.y + 12, vx: 400, vy: 0 };
    c.step(0.02);
    out.blockSide = { vx: c.ball.vx, vy: c.ball.vy, x: c.ball.x, blockLeft: block.x };

    // 4. the ball ends every block hit outside the block it broke
    const d = make();
    d.blocks.forEach((bl: any, i: number) => { bl.active = i === 0; });
    const bd = d.blocks[0];
    d.ball = { x: bd.x + 40, y: bd.y - 6, vx: 0, vy: 400 };
    d.step(0.02);
    out.pushOut = { y: d.ball.y, blockTop: bd.y, clear: d.ball.y + 7 <= bd.y + 0.001 };

    // 5. combo ladder
    const e = make();
    e.ball = { x: 85, y: 70, vx: 0, vy: 350 }; e.step(0.02);
    const first = e.score;
    e.ball = { x: 85 + 89, y: 70, vx: 0, vy: 350 }; e.step(0.02);
    out.combo = { first, second: e.score - first };

    // 6. long unattended rally: no NaN, no escape, no stall
    const f = make();
    let escaped = false, nan = false, flat = 0;
    for (let i = 0; i < 240 * 60; i++) {
      f.paddleX = Math.max(66, Math.min(734, f.ball.x));
      if (f.status !== 'playing') { f.status = 'playing'; }
      f.step(1 / 240);
      const { x, y, vx, vy } = f.ball;
      if (!Number.isFinite(x + y + vx + vy)) { nan = true; break; }
      if (x < 10 || x > 790 || y < 10) { escaped = true; break; }
      if (Math.abs(vy) < Math.hypot(vx, vy) * 0.3) flat++;
    }
    out.rally = { escaped, nan, flat, score: f.score, cleared: f.blocks.filter((bl: any) => !bl.active).length };
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  expect(r.paddle.vx).toBeCloseTo(240, 5);
  expect(r.paddle.vy).toBeCloseTo(-330, 5);
  expect(r.side.vx).toBeLessThan(0);
  expect(r.blockSide.vx).toBeLessThan(0);
  expect(Math.abs(r.blockSide.vy)).toBeGreaterThan(0); // flat ball gets a vertical component back
  expect(r.pushOut.clear).toBe(true);
  expect(r.combo).toEqual({ first: 100, second: 200 });
  expect(r.rally.escaped).toBe(false);
  expect(r.rally.nan).toBe(false);
  expect(r.rally.flat).toBe(0);
});
