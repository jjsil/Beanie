import { expect, test } from '@playwright/test';

// Regression guard: a shot row with long, unbreakable-by-design (nowrap) text
// used to widen the shot list's implicit grid column, so every row ran under
// the shot graph and the enjoyment badges were pushed out of view. Rows must
// stay inside the list column and ellipsize instead.
for (const viewport of [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 }
]) {
  test(`history shot list keeps its column at ${viewport.width}x${viewport.height} with long row text`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // Gateway unreachable -> explicit Demo mode with sample shots.
    await page.route('**/api/v1/**', (route) => route.abort('failed'));
    await page.goto('/');
    await expect(page.locator('.shot-item').first()).toBeVisible();

    const layout = await page.evaluate(() => {
      const items = [...document.querySelectorAll<HTMLElement>('.shot-item')];
      // Stand in for a long community profile title / recipe line. Mutating
      // the rendered rows keeps the check on the built bundle's real CSS.
      items[0]!.querySelector('.shot-item-profile')!.textContent =
        'Fresh · Extremely Long Community Profile Title — Adaptive Blooming Allongé v4.2 (Rao-Style Turbo) · Nov 5';
      items[1]!.querySelector('.shot-item-recipe')!.textContent =
        'Some Very Long Roaster Name Natural Anaerobic Geisha Lot 42 18g → 40g @ 28s';
      const list = document.querySelector<HTMLElement>('.shot-list')!;
      const pane = document.querySelector<HTMLElement>('.shot-detail-pane')!;
      return {
        listRight: list.getBoundingClientRect().right,
        paneLeft: pane.getBoundingClientRect().left,
        listScrollWidth: list.scrollWidth,
        listClientWidth: list.clientWidth,
        rows: items.map((item) => ({
          right: item.getBoundingClientRect().right,
          scrollWidth: item.scrollWidth,
          clientWidth: item.clientWidth,
          badgeRight: item.querySelector('.enjoyment-badge')?.getBoundingClientRect().right ?? null
        }))
      };
    });

    expect(layout.listRight).toBeLessThanOrEqual(layout.paneLeft + 0.5);
    expect(layout.listScrollWidth).toBeLessThanOrEqual(layout.listClientWidth);
    for (const row of layout.rows) {
      expect(row.right).toBeLessThanOrEqual(layout.listRight + 0.5);
      expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
      if (row.badgeRight != null) expect(row.badgeRight).toBeLessThanOrEqual(layout.listRight + 0.5);
    }
  });
}
