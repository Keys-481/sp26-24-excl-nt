/**
 * File: frontend/tests/e2e/smoke.spec.js
 * Basic smoke test to ensure the frontend loads correctly.
 */
import { test, expect } from '@playwright/test';

test('home page loads', async ({ page, baseURL }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Should land on /login page or role dashboard if already authenticated
    await expect(page).toHaveURL(/\/(login|.*\/dashboard)$/);

    // Basic check that HTML is present
    await expect(page.locator('html')).toBeVisible();
});