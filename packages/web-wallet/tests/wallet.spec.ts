import { test, expect } from '@playwright/test';

test.describe('Hathor Wallet V1 UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('displays wallet home page with balance', async ({ page }) => {
    // Check that the main elements are visible
    await expect(page.locator('h1')).toContainText('HTR');
    await expect(page.locator('text=Hathor Network')).toBeVisible();
    
    // Check that action buttons are present
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
    await expect(page.locator('button:has-text("Receive")')).toBeVisible();
    await expect(page.locator('button:has-text("History")')).toBeVisible();
  });

  test('displays wallet address', async ({ page }) => {
    // Check that the address section is visible
    await expect(page.locator('text=Your Address')).toBeVisible();
    await expect(page.locator('[class*="font-mono"]')).toBeVisible();
  });

  test('can copy wallet address', async ({ page }) => {
    // Click the copy button
    const copyButton = page.locator('button:has([data-lucide="copy"], [data-lucide="check"])').first();
    await copyButton.click();
    
    // Check that the icon changes to indicate success (check mark)
    await expect(page.locator('[data-lucide="check"]')).toBeVisible({ timeout: 1000 });
  });

  test('opens send token dialog', async ({ page }) => {
    // Click send button
    await page.locator('button:has-text("Send")').click();
    
    // Check that the dialog opens
    await expect(page.locator('text=Send HTR')).toBeVisible();
    await expect(page.locator('text=Available Balance')).toBeVisible();
    await expect(page.locator('input[placeholder*="recipient"]')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test('opens receive token dialog', async ({ page }) => {
    // Click receive button
    await page.locator('button:has-text("Receive")').click();
    
    // Check that the dialog opens
    await expect(page.locator('text=Receive HTR')).toBeVisible();
    await expect(page.locator('text=Your Wallet Address')).toBeVisible();
    await expect(page.locator('[data-lucide="qr-code"]')).toBeVisible();
  });

  test('opens history dialog', async ({ page }) => {
    // Click history button
    await page.locator('button:has-text("History")').click();
    
    // Check that the dialog opens
    await expect(page.locator('text=Transaction History')).toBeVisible();
    
    // Check for transaction items or empty state
    const hasTransactions = await page.locator('text=Sent HTR, Received HTR').count() > 0;
    if (!hasTransactions) {
      await expect(page.locator('text=No transactions yet')).toBeVisible();
    }
  });

  test('validates send form', async ({ page }) => {
    // Open send dialog
    await page.locator('button:has-text("Send")').click();
    
    // Try to send without filling fields
    await page.locator('button:has-text("Send")').last().click();
    
    // Should show validation error
    await expect(page.locator('text=Please enter a recipient address')).toBeVisible();
    
    // Fill recipient but not amount
    await page.fill('input[placeholder*="recipient"]', 'HJKj8Ks9d8f7sdf8s7df8s7df8s7df8s7df');
    await page.locator('button:has-text("Send")').last().click();
    
    // Should show amount validation error
    await expect(page.locator('text=Please enter a valid amount')).toBeVisible();
  });

  test('shows recent transactions on home page', async ({ page }) => {
    // Check for recent activity section
    const recentActivity = page.locator('text=Recent Activity');
    if (await recentActivity.isVisible()) {
      await expect(page.locator('text=View all')).toBeVisible();
      // Should have some transaction items
      await expect(page.locator('text=Sent, Received').first()).toBeVisible();
    }
  });

  test('closes dialogs when clicking cancel/close', async ({ page }) => {
    // Test send dialog
    await page.locator('button:has-text("Send")').click();
    await expect(page.locator('text=Send HTR')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Send HTR')).not.toBeVisible();
    
    // Test receive dialog
    await page.locator('button:has-text("Receive")').click();
    await expect(page.locator('text=Receive HTR')).toBeVisible();
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('text=Receive HTR')).not.toBeVisible();
  });
});