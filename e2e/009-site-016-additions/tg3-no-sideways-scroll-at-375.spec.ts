import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 375, height: 812 } });

// TG3 (major): no horizontal overflow at phone width, cards in one column.
// Live run 2026-10-07 at 706e5f4: scrollWidth 360, innerWidth 375, one 312px
// column, all nine cards at the same left edge.
test('TG3: at phone width the page does not scroll sideways', async ({ page }) => {
  await page.goto(TARGET);
  const grid = page.locator('#lifecycle ul:has(> li.bg-surface)');
  await grid.scrollIntoViewIfNeeded();
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(m.sw).toBeLessThanOrEqual(m.iw);
  const lefts = await grid.locator('> li').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
  expect(lefts).toHaveLength(9);
  expect(new Set(lefts).size).toBe(1);
});
