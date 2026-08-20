import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

// TG4 (major) — declared evidence is VIDEO. 'retain-on-failure' keeps a video
// only when the test fails, so a passing run of this spec produces none either:
// the spec reproduces TG4's assertion, NOT its evidence clause. Switch to
// video: 'on' if you want the declared artefact every run.
test.use({ video: 'retain-on-failure' });

// Live run: assertion held; case FAILED on the evidence clause because the
// Playwright MCP server exposes no video capability.
test('TG4 — the first install command is a marketplace add', async ({ page }) => {
  await page.goto(TARGET + '#install');
  const first = page.locator('#install').locator('code, pre').first();
  await expect(first).toContainText('/plugin marketplace add');
});
