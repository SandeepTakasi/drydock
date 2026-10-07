import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 1280, height: 900 } });

// TG5 (minor): DESIGNED TO FAIL (D3, the page publishes no token figure).
// The assertion below is the case's Then clause; test.fail() makes the suite
// green only when it fails. Live run 2026-10-07 at 706e5f4: no "overhead:",
// and no occurrence of "tokens" at all in the page text.
test('TG5: designed to fail, the page publishes a token or cost figure', async ({ page }) => {
  test.fail();
  await page.goto(TARGET);
  const text = await page.locator('body').innerText();
  const figure = text.includes('overhead:') || /\d[\d,.]*\s*[kKM]?\s*tokens|tokens\s*[:=]?\s*\d/.test(text);
  expect(figure).toBe(true);
});
