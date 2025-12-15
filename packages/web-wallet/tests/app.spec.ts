import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('should load the connection page', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads with the connect wallet UI
    await expect(page.getByRole('heading', { name: /connect to hathor wallet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
  });
});
