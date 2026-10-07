import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 1280, height: 800 } });

// TG6 (minor): DESIGNED TO FAIL. The case asserts the wave diagram's lanes are
// in the first viewport; D3 moved the diagram to the loop section, so the
// correct outcome is that they are not. Live run 2026-10-07 at f3be934: the
// lane labels sit at y=2195, outside the first 800px, so the case failed as
// designed (verdict PASS). `test.fail()` keeps that inversion: this spec goes
// red if the lanes ever reappear in the hero.
test('TG6 (inverted): the T1.1.x lanes are visible in the first viewport', async ({ page }) => {
  test.fail();
  await page.goto(TARGET);
  for (const lane of ['T1.1.1', 'T1.1.2', 'T1.1.3']) {
    const el = page.getByText(lane).first();
    await expect(el).toBeInViewport();
  }
});
