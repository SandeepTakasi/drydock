import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 1280, height: 900 } });

// TG1 (blocker): nine lifecycle cards in three full rows at desktop width.
// Live run 2026-10-07 at 706e5f4: nine cards, three distinct tops, card 9
// (check) on the row of cards 7 and 8, every card 357px wide.
test('TG1: the lifecycle grid shows nine pieces in three full rows', async ({ page }) => {
  await page.goto(TARGET);
  const cards = page.locator('#lifecycle ul:has(> li.bg-surface) > li');
  await cards.first().scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(9);
  const boxes = await cards.evaluateAll((els) =>
    els.map((el) => {
      const b = el.getBoundingClientRect();
      return { name: (el as HTMLElement).innerText.split('\n')[0], top: Math.round(b.top), width: Math.round(b.width) };
    }),
  );
  const names = boxes.map((b) => b.name);
  expect(names).toContain('init');
  expect(names).toContain('check');
  expect(boxes[8].top).toBe(boxes[6].top);
  expect(boxes[8].top).toBe(boxes[7].top);
  expect(new Set(boxes.map((b) => b.top)).size).toBe(3);
  expect(new Set(boxes.map((b) => b.width)).size).toBe(1);
});
