import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    baseURL: process.env.PREVIEW_URL || 'http://localhost:8081',
  },
  projects: [
    {
      name: 'consumer-app',
      testMatch: /smoke\.test\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin-app',
      testMatch: /admin-workflows\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
