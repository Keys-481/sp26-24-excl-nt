/**
 * File: frontend/tests/e2e/DegreePlan.spec.js
 * E2E tests for the DegreePlan component within the Advising page.
 * Tests:
 *   - advisor's ability to search for a student and view their degree plan.
 *   - advisor's ability to toggle between semester and requirements view.
 *   - advisor's ability to edit course status in the degree plan.
 */

import { expect, test } from '@playwright/test';

/**
 * Tests for searching a student and viewing their degree plan.
 */
test.describe('Advising - DegreePlan component', () => {

    test('advisor can search student and view degree plan', async ({ page }, testInfo) => {
        if (!testInfo.project?.name?.includes('advisor')) test.skip();
        // Go to advisor/advising page
        await page.goto(`/advisor/advising`);

        // Search for the student by school ID
        const searchInput = page.getByPlaceholder('School ID');
        await searchInput.fill('112299690');
        await searchInput.press('Enter');

        // Wait for search results to show up
        await page.waitForSelector('[data-testid="search-results"], table, .results', { timeout: 10000 });
        await expect(page.getByText('Alice Johnson', { exact: false })).toBeVisible({ timeout: 10000 });

        // Click on the student result
        await page.getByText('Alice Johnson', { exact: false }).click();

        // Wait for the list of programs to appear
        await expect(page.getByText('Master of Science in Organizational Performance and Workplace Learning'))
            .toBeVisible({ timeout: 10000 });

        // Click the desired program
        await page.getByText('Master of Science in Organizational Performance and Workplace Learning').click();

        // Wait for the degree plan API call
        const apiResponse = await page.waitForResponse(
            r =>
                r.url().includes('/students/112299690/degree-plan') &&
                r.status() === 200,
            { timeout: 10000 }
        );

        console.log('Degree plan loaded:', apiResponse.url());

        // Verify that the degree plan is displayed
        await expect(page.getByText('Credit Count: 15 / 36')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('OPWL-536').first()).toBeVisible();
    });

});

/**
 * Tests for DegreePlan component view toggle functionality.
 */
test.describe('DegreePlan component view toggle', () => {

    test('advisor can toggle between semester and requirements view', async ({ page, baseURL }, testInfo) => {
        // Only run this for advisor
        if (!testInfo.project?.name?.includes('advisor')) test.skip();

        // Go to advisor/advising page
        await page.goto(`${baseURL}/advisor/advising`);

        // Search for the student by school ID
        const searchInput = page.getByPlaceholder('School ID');
        await searchInput.fill('112299690');
        await searchInput.press('Enter');

        // Wait for search results to show up
        await page.waitForSelector('[data-testid="search-results"], table, .results', { timeout: 15000 });
        await expect(page.getByText('Alice Johnson', { exact: false })).toBeVisible({ timeout: 15000 });

        // Click on the student result
        await page.getByText('Alice Johnson', { exact: false }).click();

        // Wait for the list of programs to appear
        await expect(page.getByText('Master of Science in Organizational Performance and Workplace Learning'))
            .toBeVisible({ timeout: 10000 });

        // Click the desired program
        await page.getByText('Master of Science in Organizational Performance and Workplace Learning').click();

        // Wait for degree plan to load (accepts both with and without api)
        // Wait for the requirements table to appear
        await expect(page.locator('.requirements-table')).toBeVisible();

        // Verify initial view is requirements view
        await expect(page.getByText('Credit Count: 15 / 36')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Core Courses for OPWL MS')).toBeVisible();

        // Click to toggle to semester view
        await page.getByRole('button', { name: 'Semester View' }).click();

        // Verify semester view is displayed
        await expect(page.getByText('Fall 2024')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('OPWL-536').first()).toBeVisible();
    });

});

/**
 * Tests for editing course status in DegreePlan component.
 */
test.describe('DegreePlan edit course status', () => {
    test('advisor can edit course status in degree plan', async ({ page, baseURL }, testInfo) => {
        // Only run this for advisor
        if (!testInfo.project?.name?.includes('advisor')) test.skip();

        // Go to advisor/advising page
        await page.goto(`${baseURL}/advisor/advising`);

        // Search for the student by school ID
        const searchInput = page.getByPlaceholder('School ID');
        await searchInput.fill('112299690');
        await searchInput.press('Enter');

        // Wait for search results to show up
        await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 10000 });

        // Click on the student result
        await page.waitForSelector('[data-testid="search-results"], table, .results', { timeout: 15000 });
        await expect(page.getByText('Alice Johnson', { exact: false })).toBeVisible({ timeout: 15000 });
        await page.getByText('Alice Johnson', { exact: false }).click();

        // Wait for the list of programs to appear
        await expect(page.getByText('Master of Science in Organizational Performance and Workplace Learning'))
            .toBeVisible({ timeout: 15000 });

        // Wait for degree plan to load
        await Promise.all([
            page.waitForResponse(
                r => /\/(api\/)?students\/112299690\/degree-plan/.test(r.url()) &&
                    ([200, 204, 304].includes(r.status())),
                { timeout: 30000 }
            ),
            page.getByText('Master of Science in Organizational Performance and Workplace Learning').click(),
        ]);

        // Wait for known course to be visible
        const courseRowElement = page.locator('tr', { hasText: 'OPWL-507' }).first();
        await expect(courseRowElement).toBeVisible({ timeout: 15000 });

        // Click edit button for that row
        const editButton = courseRowElement.locator('.course-status-edit-btn');
        await editButton.click();

        // Wait for the edit row to appear after clicking the edit button
        const editRow = page.locator('tr.course-edit-row').first();
        await expect(editRow).toBeVisible({ timeout: 5000 });

        // locate the status dropdown within the edit row
        const statusSelect = editRow.locator('select').first();
        await expect(statusSelect).toBeVisible({ timeout: 5000 });

        // Change status to Planned
        await statusSelect.selectOption('Planned');
        await expect(statusSelect).toHaveValue('Planned', { timeout: 5000 });

        // Wait briefly for UI to update
        await page.waitForTimeout(300);

        // Wait for the semester dropdown and its options to be visible and select Spring 2025
        const semesterSelect = editRow.locator('select').nth(1);
        await expect(semesterSelect).toBeVisible({ timeout: 5000 });
        await semesterSelect.selectOption({ label: 'Spring 2025' });
        await expect(semesterSelect.locator('option:checked')).toHaveText('Spring 2025', { timeout: 5000 });

        // Wait for Save button to become visible and enabled
        const saveButton = editRow.getByRole('button', { name: 'Save' });
        await expect(saveButton).toBeVisible();
        await expect(saveButton).toBeEnabled();

        await page.route(/\/(api\/)?students\/112299690\/degree-plan\/course/, async (route) => {
            if (route.request().method() === 'PATCH') {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        course_status: 'Planned',
                        semester_id: 5
                    }),
                });
            }
            return route.fallback();
        });

        // Trigger PATCH by clicking Save and wait for completion
        const [patchResponse] = await Promise.all([
            page.waitForResponse(
                r => /\/(api\/)?students\/112299690\/degree-plan\/course/.test(r.url())
                    && r.request().method() === 'PATCH'
                    && r.ok(),
                { timeout: 30000 }
            ),
            saveButton.click(),
        ]);

        // Verify PATCH was successful
        expect(await patchResponse.ok()).toBeTruthy();

        // Re-query the DOM after React re-renders
        const updatedRow = page.locator('tr', { hasText: 'OPWL-507' }).first();
        await expect(updatedRow).toHaveClass(/course-status-planned/, { timeout: 15000 });
    });
});
