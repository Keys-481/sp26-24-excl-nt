/**
 * File: frontend/tests/e2e/Settings.spec.js
 * End-to-end (E2E) tests for the StudentSettings component.
 *
 * These tests validate core functionality of the Settings page for student users:
 *   - Toggling between profile and settings views.
 *   - Updating the user's password.
 *   - Switching role-based views.
 *   - Updating user preferences (theme, font size, font family).
 */

import { expect, test } from '@playwright/test';

test.describe('User - Settings component', () => {

    /**
     * Runs before each test in this suite.
     *
     * @async
     * @function beforeEach
     * @param {import('@playwright/test').Page} page - Playwright page object.
     * @param {import('@playwright/test').TestInfo} testInfo - Metadata about the current test run.
     *
     * @description
     * Navigates to the settings page for the current project path and waits
     * until the Settings view is visible, ensuring user info has been loaded.
     */
    test.beforeEach(async ({ page }, testInfo) => {
        const path = testInfo.project?.name;
        await page.goto(`/` + path + `/settings`);
        await expect(page.getByText('Settings')).toBeVisible({ timeout: 10000 });
    });

    /**
     * Test: Toggle between profile and settings views.
     *
     * @async
     * @function
     * @param {import('@playwright/test').Page} page - Playwright page object.
     *
     * @description
     * Ensures that the user can switch from the Settings view to the Profile view,
     * verify that personal information is displayed, and then return back to the Settings view.
     */
    test('user can toggle between profile and settings views', async ({ page }) => {
        await expect(page.getByText('Settings')).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: 'Settings' }).click();

        // Switch to Profile view
        await page.locator('.view-toggle button').first().click();
        await expect(page.getByText('Personal Information')).toBeVisible();

        // Switch back to Settings view
        await page.locator('.view-toggle button').nth(1).click();
    });

    /**
     * Test: Update user password.
     *
     * @async
     * @function
     * @param {import('@playwright/test').Page} page - Playwright page object.
     *
     * @description
     * Validates that the user can enter a new password, trigger the update,
     * and receive a success message. The password update API call is intercepted
     * and mocked to return a successful response.
     */
    test('user can update password', async ({ page }) => {
        await page.getByRole('button', { name: 'Settings' }).click();
        await page.getByRole('button', { name: 'Profile' }).click();

        const passwordInput = page.getByPlaceholder('New password');
        await passwordInput.fill('newSecurePassword123');

        // Mock API response for password update
        await page.route(/\/users\/.*\/password/, async (route) => {
            if (route.request().method() === 'PUT') {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true }),
                });
            }
            return route.fallback();
        });

        await page.getByRole('button', { name: 'Update' }).click();
        await expect(page.getByText('Password updated successfully.')).toBeVisible({ timeout: 5000 });
    });

    /**
     * Test: Update user preferences (theme, font size, font family).
     *
     * @async
     * @function
     * @param {import('@playwright/test').Page} page - Playwright page object.
     *
     * @description
     * Validates that the user can toggle the dark theme, change font size,
     * and change font family. Each preference update is verified by checking
     * the updated state of the UI controls.
     */
    test('user can update preferences (theme, font size, font family)', async ({ page }) => {
        await page.getByRole('button', { name: 'Settings' }).click();

        // Toggle dark theme
        await page.locator('.switch .slider').click();
        await expect(page.locator('input[type="checkbox"]')).toBeChecked();

        // Change font size
        const fontSizeSelect = page.locator('p:has-text("Font Size:")').locator('..').locator('select');
        await expect(fontSizeSelect).toBeVisible({ timeout: 10000 });
        await fontSizeSelect.selectOption({ label: 'Large' });
        await expect(fontSizeSelect).toHaveValue('4px');

        // Change font family
        const fontFamilySelect = page.locator('p:has-text("Font Family:")').locator('..').locator('select');
        await expect(fontFamilySelect).toBeVisible({ timeout: 10000 });
        await fontFamilySelect.selectOption({ label: 'Courier' });
        await expect(fontFamilySelect).toHaveValue("'Courier New', monospace");
    });
});
