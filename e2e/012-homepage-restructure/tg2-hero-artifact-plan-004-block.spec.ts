import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 1280, height: 800 } });

// TG2 (blocker): the hero artifact is the plan 004 BLOCK, labelled as such.
// Live run 2026-10-07 at f3be934: BLOCK present, the deviations line present,
// caption names plan 004 and links blob/main/docs/plans/004-seatrial-e2e-gate.md.
test('TG2: the hero shows the plan 004 BLOCK excerpt with its source link', async ({ page }) => {
  await page.goto(TARGET);
  const fig = page.locator('figure:has([data-excerpt-of])');
  await expect(fig).toContainText('BLOCK');
  await expect(fig).toContainText('Deviations logged: 6 (3 discovered by wavecheck)');
  await expect(fig.locator('p').first()).toContainText('plan 004');
  const href = await fig.locator('a').first().getAttribute('href');
  expect(href).toContain('docs/plans/004-seatrial-e2e-gate.md');
});
