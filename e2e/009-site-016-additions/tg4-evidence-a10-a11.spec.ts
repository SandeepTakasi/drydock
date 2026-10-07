import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 1280, height: 900 } });

// TG4 (blocker): A10 and A11 rows show their compat status words. The compat
// cells are already plain uppercase, so D10's normalisation leaves them as is.
// Live run 2026-10-07 at 706e5f4: pills "OBSERVED FLAG THEN PASS" and
// "OBSERVED PARTIAL" (rendered text, after CSS uppercase).
for (const [id, status] of [
  ['A10', 'OBSERVED FLAG THEN PASS'],
  ['A11', 'OBSERVED PARTIAL'],
] as const) {
  test(`TG4: evidence row ${id} reads ${status}`, async ({ page }) => {
    await page.goto(TARGET);
    const row = page.locator('#evidence li').filter({ hasText: new RegExp(`^\\s*${id}\\b`) });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toHaveCount(1);
    await expect(row.getByText(status, { exact: true })).toBeVisible();
  });
}
