/**
 * @file notifications.spec.js
 * @description End-to-end Playwright test suite for the Notifications page.
 * This suite verifies that notifications are displayed, can be marked read/unread,
 * deleted, and that the detail panel behaves correctly.
 */
import { expect, test } from '@playwright/test';

test.describe('Notifications Page', () => {

    /**
     * Runs before each test in this suite.
     * - Navigates to the `/notifications` route.
     * - Mocks the `/notifications` API response with sample notification data.
     */
    test.beforeEach(async ({ page }) => {
        // Navigate to the notifications page
        await page.goto('/notifications');

        // Mock API responses if needed
        await page.route('**/notifications', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    notifications: [
                        {
                            notification_id: 1,
                            title: 'New Degree Plan Comment',
                            triggered_by_name: 'Advisor Alice',
                            student_name: 'John Doe',
                            program_name: 'Computer Science',
                            created_at: new Date().toISOString(),
                            is_read: false,
                            comment_id: 101,
                            notif_message: 'Please review your course selection.',
                            program_id: 55,
                            school_student_id: 999,
                        },
                        {
                            notification_id: 2,
                            title: 'Updated Degree Plan Comment',
                            triggered_by_name: 'Advisor Bob',
                            student_name: 'Jane Smith',
                            program_name: 'Mathematics',
                            created_at: new Date().toISOString(),
                            is_read: true,
                            comment_id: 102,
                            notif_message: 'Updated comment text.',
                            program_id: 77,
                            school_student_id: 888,
                        },
                    ],
                }),
            });
        });
    });

    /**
     * @test Verifies that the notifications list renders correctly.
     * - Skips execution for admin projects.
     * - Asserts that the page title is "Notifications".
     * - Ensures at least one notification row is present in the table.
     */
    test('should display notifications list', async ({ page }, testInfo) => {
        if (testInfo.project?.name?.includes('admin')) test.skip();

        await expect(page.locator('h1')).toHaveText('Notifications');

        const rowCount = await page.locator('.notif-table tbody tr').count();
        expect(rowCount).toBeGreaterThan(0);
    });

    /**
     * @test Verifies that notifications can be selected and marked read/unread.
     * - Skips execution for admin projects.
     * - Selects the first notification via its checkbox.
     * - Ensures the "mark read" button is enabled.
     * - Clicks the button and asserts that the notification row is updated to "read".
     */
    test('should allow selecting and marking notifications read/unread', async ({ page }, testInfo) => {
        if (testInfo.project?.name?.includes('admin')) test.skip();

        const firstCheckbox = page.locator('.notif-checkbox input').first();
        await firstCheckbox.click();

        const markReadBtn = page.locator('.mark-read-btn');
        await expect(markReadBtn).toBeEnabled();

        await markReadBtn.click();
        // After clicking, the icon should toggle
        await expect(page.locator('.notif-row').first()).toHaveClass(/read/);
    });

    /**
     * @test Verifies that notifications can be deleted.
     * - Skips execution for admin projects.
     * - Selects the first notification via its checkbox.
     * - Confirms the deletion dialog and accepts it.
     * - Asserts that the number of rows in the table decreases by one.
     */
    test('should allow deleting notifications', async ({ page }, testInfo) => {
        if (testInfo.project?.name?.includes('admin')) test.skip();
        const firstCheckbox = page.locator('.notif-checkbox input').first();
        await firstCheckbox.click();

        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Are you sure you want to delete');
            await dialog.accept();
        });

        const expectedNotif = await page.locator('.notif-table tbody tr').count() - 1;

        await page.locator('.notif-delete-btn').click();
        await expect(page.locator('.notif-table tbody tr')).toHaveCount(expectedNotif);
    });

    /**
     * @test Verifies that the notification detail panel opens and closes correctly.
     * - Skips execution for admin projects.
     * - Clicks the first notification row to open the detail panel.
     * - Asserts that the panel is visible.
     * - Clicks the "Close" button and asserts that the panel is removed from the DOM.
     */
    test('should open and close notification detail panel', async ({ page }, testInfo) => {
        if (testInfo.project?.name?.includes('admin')) test.skip();

        await page.locator('.notif-row').first().click();
        await expect(page.locator('.notif-detail-panel')).toBeVisible();

        await page.locator('.notif-detail-header button').click();
        await expect(page.locator('.notif-detail-panel')).toHaveCount(0);
    });
});
