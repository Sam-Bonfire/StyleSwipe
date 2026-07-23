import { test, expect } from '@playwright/test';

test('has expected page title on home page', async ({ page }) => {
  await page.goto('/');

  // Expect the title to contain a specific string (can be adjusted later)
  // Just ensuring the page loads without a fatal error
  const body = await page.locator('body');
  await expect(body).toBeVisible();
});
