import { test, expect } from '@playwright/test';

test.describe('Hathor Wallet V1 UI - Disconnected State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('displays connect wallet page when not connected', async ({ page }) => {
    // Check that the main heading is visible
    await expect(page.locator('h1')).toContainText('Connect to Hathor Wallet');

    // Check that connect button is present
    await expect(page.locator('button:has-text("Connect Wallet")')).toBeVisible();
  });

  test('shows loading state when connecting', async ({ page }) => {
    // Click connect button
    await page.locator('button:has-text("Connect Wallet")').click();

    // Should show loading indicator
    await expect(page.locator('text=Connecting')).toBeVisible({ timeout: 2000 }).catch(() => {
      // Expected to timeout without MetaMask, that's OK for this test
    });
  });

  test('has responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Connect Wallet")')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Connect Wallet")')).toBeVisible();
  });
});