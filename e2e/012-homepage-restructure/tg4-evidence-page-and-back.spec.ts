import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 1280, height: 900 } });

// TG4 (blocker): the evidence page is reachable from the header and links home.
// Live run 2026-10-07 at f3be934: /drydock/evidence/, one h1, A3 shows
// PUBLISHED, NOT PASSED; Install lands on /drydock/#install with the section
// in view.
test('TG4: header Evidence then Install navigate between the two pages', async ({ page }) => {
  await page.goto(TARGET);
  await page.locator('header').getByRole('link', { name: 'Evidence', exact: true }).click();
  await expect(page).toHaveURL(/[/]drydock[/]evidence[/]$/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('#evidence')).toContainText('PUBLISHED, NOT PASSED');
  await page.locator('header').getByRole('link', { name: 'Install', exact: true }).click();
  await expect(page).toHaveURL(/[/]drydock[/]#install$/);
  await expect(page.locator('#install')).toBeInViewport();
});
