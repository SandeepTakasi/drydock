import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure' });

// TG2 (blocker) — DESIGNED TO FAIL. The expectation below is false against a
// string pinned by site/scripts/assert-copy.mjs, so it cannot silently become
// true. A green result WITHOUT test.fail() would be a gate defect.
// Live run: actual 'open pilot -- field benchmarks pending'. FAIL, as designed.
test.fail();
test('TG2 — the status pill reads CLOSED PILOT (it does not)', async ({ page }) => {
  await page.goto(TARGET);
  const pill = page.locator('header span').filter({ hasText: 'pilot' });
  await expect(pill).toHaveText('CLOSED PILOT');
});
