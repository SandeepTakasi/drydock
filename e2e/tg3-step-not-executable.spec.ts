import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure' });

// TG3 (blocker) — DESIGNED TO FAIL, reason 'step not executable'. The page ships
// no test ids at all; its only controls are two Copy buttons; the substring
// 'checkout' is absent from the DOM. In the live run this also triggered a
// halt-and-ask, judged a plan defect. A spec file cannot halt and ask — that
// judgement is the agent's, and this file is the part that mechanises.
test.fail();
test('TG3 — clicking checkout-submit confirms an order (no such control exists)', async ({ page }) => {
  await page.goto(TARGET);
  await page.locator('[data-testid="checkout-submit"]').click({ timeout: 5000 });
  await expect(page.getByText(/order confirm/i)).toBeVisible();
});
