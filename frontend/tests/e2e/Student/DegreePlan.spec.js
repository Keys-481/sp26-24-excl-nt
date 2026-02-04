import { expect, test } from '@playwright/test';

/**
 * Test suite grouping all Student Degree Plan related tests.
 */
test.describe('Student Degree Plan', () => {

    /**
     * Hook executed before each test in this suite.
     * 
     * @param {import('@playwright/test').Page} page - Playwright page object used to interact with the browser.
     * @param {string} baseURL - Base URL of the application under test, defined in playwright.config.js.
     * @param {import('@playwright/test').TestInfo} testInfo - Metadata about the current test execution.
     * 
     * Behavior:
     *  Skips execution if the current project is not configured for "student".
     *  Navigates to the student dashboard to ensure a consistent starting state.
     */
    test.beforeEach(async ({ page, baseURL }, testInfo) => {
        // Only run these tests for the student project
        if (!testInfo.project?.name?.includes('student')) test.skip();
        // Ensure we start from a known state
        await page.goto(`${baseURL}/student/dashboard`);
    });

    /**
     * Test case: Verify that a student can view the dashboard.
     * 
     * @param {import('@playwright/test').Page} page - Playwright page object used to interact with the browser.
     * 
     * Assertions:
     *   Dashboard heading (<h1>) contains the text "Student Homepage".
     *   "Degree Tracking" button is visible.
     *   "Settings" button is visible.
     */
    test('student can view dashboard', async ({ page }) => {
        await expect(page.locator('h1')).toHaveText('Student Homepage');
        await expect(page.getByRole('button', { name: 'Degree Tracking' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
    });
});