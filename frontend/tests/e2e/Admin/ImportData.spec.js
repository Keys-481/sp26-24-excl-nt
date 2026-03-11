/**
 * End-to-End Tests for the Admin Import Data Page
 *
 * File: tests/e2e/Admin/ImportData.spec.js
 * Framework: Playwright
 *
 * This suite validates the functionality of the Admin Import Data
 * page, including rendering, file upload, and reject of invalid
 * file types.
 */
import { expect, test } from '@playwright/test';
// import path from 'path';

test.describe('AdminImportData page', () => {

    /**
     * Ensures tests only run for admin projects.
     *
     * @param testInfo Provides project metadata.
     * @effect Skips tests if the project name does not contain "admin".
     */
    test.beforeAll(async ({ }, testInfo) => {
        const isAdmin = /admin/i.test(testInfo.project.name);
        if (!isAdmin) test.skip(`Requires admin permissions; project "${testInfo.project.name}" is not admin`);
    });

    /**
     * Sets up mocked backend routes before each test.
     *
     * Routes mocked:
     * - /import (POST) → simulates successful file import
     * 
     * @param page Playwright page instance
     * @effect Navigates to /admin/import-data after route setup
     */
    test.beforeEach(async ({ page }) => {
        // Search endpoint
        await page.route('/import', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Import successful' }),
            });

        });
        await page.goto('/admin/import-data');
    });

    /**
     * Verifies that the Import Data page renders correctly.
     * 
     * Assertions:
     * - Title bar contains "Import Data"
     * - Dropzone is visible
     */
    test('renders Import Data page with title and dropzone', async ({ page }) => {
        await expect(page.locator('.title-bar h1')).toHaveText('Import Data');
        await expect(page.locator('.import-data-box')).toBeVisible();
    });

    /**
     * Verifies the dropzone displays the correct idle prompt.
     */
    test('dropzone shows correct idle text', async ({ page }) => {
        await expect(page.locator('.import-data-box')).toContainText('Drag and drop files here, or click to select files');
    });

    /**
     * Tests uploading a valid .xlsx file via the file input.
     * 
     * Steps:
     * - Set input files to a valid .xlsx file
     * 
     * Assertion:
     * - File name appears in the accepted files list
     */
    test('accepts a valid .xlsx file', async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');

        await fileInput.setInputFiles({
            name: 'students.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            buffer: new TextEncoder().encode('fake xlsx content'),
        });

        await expect(page.locator('ul')).toContainText('students.xlsx');
    });

    /**
    * Tests uploading a valid .xls file via the file input.
    * 
    * Steps:
    * - Set input files to a valid .xls file
    * 
    * Assertion:
    * - File name appears in the accepted files list
    */
    test('accepts a valid .xls file', async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');

        await fileInput.setInputFiles({
            name: 'students.xls',
            mimeType: 'application/vnd.ms-excel',
            buffer: new TextEncoder().encode('fake xlsx content'),
        });

        await expect(page.locator('ul')).toContainText('students.xls');
    });

    /**
     * Tests that invalid file types are rejected.
     * 
     * Steps:
     * - Attempt to upload a .pdf file
     * 
     * Assertion:
     * - File does not appear in the accepted files list
     */
    test('reject invalid file types', async ({ page }) => {
        page.once('dialog', async (dialog) => {
            expect(dialog.message()).toContain('Excel');
            await dialog.accept();
        });

        const fileInput = page.locator('input[type="file"]');

        await fileInput.setInputFiles({
            name: 'students.pdf',
            mimeType: 'application/pdf',
            buffer: new TextEncoder().encode('fake xlsx content'),
        });

        const list = page.locator('ul');
        const isVisible = await list.isVisible();
        if (isVisible) {
            await expect(list).not.toContainText('students.pdf');
        }
    });

    /**
     * Tests that multiple valid files can be uploaded at once.
     * 
     * Assertion:
     * - Both file names appear in the accepted files list
     */
    test('accepts multiple valid files', async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');

        await fileInput.setInputFiles([
            { name: 'students.xls', mimeType: 'application/vnd.ms-excel', buffer: new TextEncoder().encode('fake xlsx content'), },
            { name: 'courses.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: new TextEncoder().encode('fake xlsx content 2'), },
        ]);

        await expect(page.locator('ul')).toContainText('students.xls');
        await expect(page.locator('ul')).toContainText('courses.xlsx');
    });

    /**
     * Tests that more than 5 files cannot be uploaded at once.
     * 
     * Assertion:
     * - No file names should appear in the accepted files list
     */
    test('rejects more than 5 files', async ({ page }) => {
        page.once('dialog', async (dialog) => {
            await dialog.accept();
        });

        const fileInput = page.locator('input[type="file"]');

        await fileInput.setInputFiles([
            { name: 'file1.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: new TextEncoder().encode('fake content 1') },
            { name: 'file2.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: new TextEncoder().encode('fake content 2') },
            { name: 'file3.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: new TextEncoder().encode('fake content 3') },
            { name: 'file4.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: new TextEncoder().encode('fake content 4') },
            { name: 'file5.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: new TextEncoder().encode('fake content 5') },
            { name: 'file6.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: new TextEncoder().encode('fake content 6') },
        ]);

        const list = page.locator('ul');
        const isVisible = await list.isVisible();
        if (isVisible) {
            await expect(list).not.toContainText('file1.xlsx');
        }
    });
});
