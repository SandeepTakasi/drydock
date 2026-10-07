import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 1280, height: 800 } });

// TG1 (blocker): the hero is visible on first paint, install above the fold.
// Live run 2026-10-07 at f3be934: h1 bottom 341, promise bottom 485, install
// commands bottom 661 and 690, all opacity 1, scrollY 0.
test('TG1: h1, promise and both install commands sit inside the first 800px', async ({ page }) => {
  await page.goto(TARGET, { waitUntil: 'load' });
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  const targets = [
    h1,
    page.locator('h1 ~ p').first(),
    page.getByText('/plugin marketplace add SandeepTakasi/drydock').first(),
    page.getByText('/plugin install drydock@drydock').first(),
  ];
  for (const t of targets) {
    await expect(t).toBeVisible();
    const box = await t.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(800);
  }
});
