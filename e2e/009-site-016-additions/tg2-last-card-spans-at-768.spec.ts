import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 768, height: 1024 } });

// TG2 (minor): at 768px the ninth card spans both columns. Live run 2026-10-07
// at 706e5f4: grid 673px wide in two 336px columns; check measured 673px.
test('TG2: at 768px the last card spans both columns', async ({ page }) => {
  await page.goto(TARGET);
  const grid = page.locator('#lifecycle ul:has(> li.bg-surface)');
  await grid.scrollIntoViewIfNeeded();
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(cols).toBe(2);
  const gridWidth = (await grid.boundingBox())!.width;
  const last = (await grid.locator('> li').nth(8).boundingBox())!;
  expect(Math.round(last.width)).toBe(Math.round(gridWidth));
});
