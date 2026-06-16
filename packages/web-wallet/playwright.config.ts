import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // The real-MetaMask E2E suite has its own config (playwright.e2e.config.ts).
  testIgnore: 'e2e/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  webServer: {
    command: 'SKIP_FEATURE_TOGGLE=true yarn dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
