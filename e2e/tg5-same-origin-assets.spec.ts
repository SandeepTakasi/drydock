import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';
const ORIGIN = new URL(TARGET).origin;

test.use({ video: 'retain-on-failure' });

// TG5 (major) — every same-origin asset the page requests returns < 400.
// Guards the class of defect this repo shipped twice: a doubled basePath in
// og:image, and a next/image string src that never received the basePath.
// Live run: 13 same-origin requests, all 200, no cross-origin request at all.
test('TG5 — no same-origin asset returns >= 400', async ({ page }) => {
  const bad: string[] = [];
  const seen: string[] = [];
  page.on('response', (r) => {
    if (!r.url().startsWith(ORIGIN)) return;
    seen.push(`${r.status()} ${r.url()}`);
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(TARGET, { waitUntil: 'load' });
  expect(seen.length, 'the page requested nothing — the listener or target is wrong').toBeGreaterThan(0);
  expect(bad, `same-origin responses >= 400:\n${bad.join('\n')}`).toEqual([]);
});
