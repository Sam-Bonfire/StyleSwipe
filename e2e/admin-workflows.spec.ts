import { test, expect, Page } from '@playwright/test';

// DRY Login Helper
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[placeholder="admin@styleswipe.com"]', 'admin@styleswipe.com');
  await page.fill('input[placeholder="••••••••"]', 'password123');
  await page.click('button:has-text("Access Dashboard")');
  await expect(page.locator('text="Dashboard Overview"')).toBeVisible();
}

test.describe('Admin App Workflows', () => {
  test.describe('TC1: Role-Based Access Guarding', () => {
    test('unauthenticated requests redirect to /login', async ({ page }) => {
      // Assuming / is the dashboard protected route
      await page.goto('/');
      // Expect redirect to login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.locator('text="Sign in to the Neural Command Center"')).toBeVisible();
    });

    test('non-admin accounts receive the Access Denied barrier', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[placeholder="admin@styleswipe.com"]', 'member@styleswipe.com');
      await page.fill('input[placeholder="••••••••"]', 'password123');
      await page.click('button:has-text("Access Dashboard")');

      // Should show Access Denied
      await expect(page.locator('text="Access Denied"')).toBeVisible();
      await expect(page.locator('text="You do not have permission to access this application."')).toBeVisible();
    });

    test('authorized admin users successfully enter /(dashboard)', async ({ page }) => {
      await loginAsAdmin(page);
    });
  });

  test.describe('TC2: Overview Dashboard & Metrics', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('stat cards and real-time activity feeds load', async ({ page }) => {
      await expect(page.locator('text="Total Users"')).toBeVisible();
      await expect(page.locator('text="Scraped Products"')).toBeVisible();
      await expect(page.locator('text="Active Jobs"')).toBeVisible();

      // Activity feed
      await expect(page.locator('text="Recent Activity"')).toBeVisible();

      // Funnel ends at the aggregator conversion event (merchant redirect).
      await expect(page.locator('text="Merchant Redirect"').first()).toBeVisible();
      await expect(page.locator('text="System Health"').first()).toBeVisible();
    });
  });

  test.describe('TC3: Catalog & Product Scraper View', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to products
      await page.click('button:has-text("Products")');
      await expect(page.locator('text="Scraped Products"')).toBeVisible();
    });

    test('search products, filter by status, and trigger re-scrape', async ({ page }) => {
      // Search with debounce
      const searchInput = page.getByPlaceholder('Search products...');
      await searchInput.fill('Sneakers');

      // Wait for debounce/results
      await page.waitForTimeout(500);

      // Filter by status (per requirement, even if UI lacks it)
      await page.click('button:has-text("Filter")');
      await page.click('text="Active"');

      // Trigger re-scrape on the first item
      const retriggerButton = page.getByRole('button', { name: 'Retrigger Scrape' }).first();
      await retriggerButton.click();

      // Assert toast confirmation
      await expect(page.locator('text="Scrape Scheduled"')).toBeVisible();
    });
  });

  test.describe('TC4: Category Hierarchy Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('navigate to /categories, create category, assert tree', async ({ page }) => {
      // Navigate to categories (per requirement, even if UI lacks it)
      await page.goto('/categories');

      // Open create category drawer/modal
      await page.click('button:has-text("Create Category")');

      // Input details
      await page.fill('input[name="categoryName"]', 'New Test Category');
      await page.click('button:has-text("Save Category")');

      // Assert tree rendering
      await expect(page.locator('text="New Test Category"')).toBeVisible();
    });
  });

  test.describe('TC5: User Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to users
      await page.click('button:has-text("Users")');
      await expect(page.locator('text="No users found"').or(page.locator('text="User Details"').first())).toBeVisible();
    });

    test('search users and open inspection modal', async ({ page }) => {
      // Search users
      const searchInput = page.getByPlaceholder('Search users...');
      await searchInput.fill('testuser');

      await page.waitForTimeout(500);

      // Open user inspection modal - deterministic without conditional statements
      const firstUserAccordion = page.locator('button[role="button"]').filter({ hasText: 'testuser' }).first();
      await firstUserAccordion.click();

      await page.click('button:has-text("Edit User")');

      // Assert modal opens
      await expect(page.locator('text="Edit User"').first()).toBeVisible();
    });
  });
});
