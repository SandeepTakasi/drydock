import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure' });

// TG6 (minor) — the nav mark renders with non-zero natural dimensions. A broken
// image reports naturalWidth 0 while still occupying its declared 26x26 box, so
// a screenshot alone does not settle this. Live run: 256 x 256, complete.
test('TG6 — the nav mark has non-zero natural dimensions', async ({ page }) => {
  await page.goto(TARGET);
  const mark = page.locator('header a img').first();
  await expect(mark).toBeVisible();
  const dims = await mark.evaluate((el: HTMLImageElement) => ({
    naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight,
    complete: el.complete,
  }));
  expect(dims.complete).toBe(true);
  expect(dims.naturalWidth).toBeGreaterThan(0);
  expect(dims.naturalHeight).toBeGreaterThan(0);
});
