import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure' });

// TG1 (blocker) — a satisfiable case reports PASS and writes its evidence.
// Live run: exactly one <h1>, text 'Drydock'. PASS.
test('TG1 — the h1 names Drydock', async ({ page }) => {
  await page.goto(TARGET);
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText('Drydock');
  // The evidence half of TG1 is the screenshot landing at the declared path.
  // A spec cannot assert seatrial's filing behaviour, only reproduce the shot.
  await page.screenshot({ path: 'test-results/tg1-h1.png' });
});
