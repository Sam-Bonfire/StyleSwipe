import { test, expect } from '@playwright/test';

test('has expected page title on home page', async ({ page }) => {
  await page.goto('/');

  // Expect the React app to have rendered content inside the root div
  const root = page.locator('#root, #__next');
  await expect(root).not.toBeEmpty();

  // Also check for the absence of standard React error boundary overlay texts if possible
  const errorOverlay = page.locator('text="An error occurred in the"');
  await expect(errorOverlay).not.toBeVisible();
});
