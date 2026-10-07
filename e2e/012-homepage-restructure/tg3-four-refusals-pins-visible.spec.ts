import { expect, test } from '@playwright/test';

const TARGET = 'http://127.0.0.1:5173/drydock/';

test.use({ video: 'retain-on-failure', viewport: { width: 1280, height: 900 } });

// TG3 (blocker): four refusals, each pin visible in its output block.
// Live run 2026-10-07 at f3be934: FAIL. Four items render and each <pre>
// contains its pin, but three pins lie past the right edge of their
// overflow-x-auto box (visible only after scrolling the box sideways):
// "same-wave ownership must be disjoint" 611-896 vs box 136-608,
// "which is outside its" 1108-1267 vs 673-1144, "does not own" 548-643 vs
// 136-608. Only "has no PASS wavecheck report" is fully in view.
const PINS = [
  'same-wave ownership must be disjoint',
  'which is outside its',
  'does not own',
  'has no PASS wavecheck report',
];

test('TG3: #refuses renders four items whose pins are visible', async ({ page }) => {
  await page.goto(TARGET);
  const section = page.locator('#refuses');
  await section.scrollIntoViewIfNeeded();
  const items = section.locator('li');
  await expect(items).toHaveCount(4);
  const pres = section.locator('pre[data-pin]');
  for (let i = 0; i < PINS.length; i++) {
    const pre = pres.nth(i);
    await expect(pre).toContainText(PINS[i]);
    const inView = await pre.evaluate((el, pin) => {
      const box = el.parentElement!.getBoundingClientRect();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const at = n.textContent!.indexOf(pin);
        if (at < 0) continue;
        const range = document.createRange();
        range.setStart(n, at);
        range.setEnd(n, at + pin.length);
        const r = range.getBoundingClientRect();
        return r.left >= box.left && r.right <= box.right;
      }
      return false;
    }, PINS[i]);
    expect(inView, `pin "${PINS[i]}" visible without scrolling its box`).toBe(true);
  }
});
