import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 375, height: 812 } });

// TG5 (major): at phone width the home page never scrolls sideways.
// Live run 2026-10-07 at f3be934: 36 samples top to bottom, scrollWidth at
// most 360 against innerWidth 375.
test('TG5: scrollWidth never exceeds innerWidth from top to bottom at 375px', async ({ page }) => {
  await page.goto(TARGET);
  const widest = await page.evaluate(async () => {
    let worst = 0;
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y <= max; y += 300) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
      worst = Math.max(worst, document.documentElement.scrollWidth - window.innerWidth);
    }
    return worst;
  });
  expect(widest).toBeLessThanOrEqual(0);
});
