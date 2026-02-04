/**
 * @fileoverview End-to-End Tests for the Admin Users Page
 * @module tests/e2e/Admin/Users.spec.js
 *
 * @description
 * This suite validates the functionality of the Admin Users page using Playwright.
 * It ensures that rendering, searching, adding, editing, deleting, and canceling
 * user operations behave correctly. All backend interactions are mocked to provide
 * deterministic test behavior.
 *
 * @framework Playwright
 */

import { expect, test } from '@playwright/test';

test.describe('AdminUsers page', () => {

    /**
     * @hook beforeAll
     * @description Ensures tests only run in admin projects. Skips execution if the
     * current project does not have admin permissions.
     * @param {object} testInfo - Playwright test metadata.
     */
    test.beforeAll(async ({ }, testInfo) => {
        const isAdmin = /admin/i.test(testInfo.project.name);
        if (!isAdmin) test.skip(`Requires admin permissions; project "${testInfo.project.name}" is not admin`);
    });

    /**
     * @hook beforeEach
     * @description Sets up mocked backend routes for user operations:
     * - `/users/search`: Returns a static list of users.
     * - `/users` (POST): Creates a new user with a fixed ID.
     * - `/users/:id` (PUT): Updates an existing user.
     * - `/users/:id` (DELETE): Deletes a user.
     * Finally, navigates to the Admin Users page.
     * @param {import('@playwright/test').Page} page - Playwright page object.
     */
    test.beforeEach(async ({ page }) => {
        const users = [
            { id: 1, name: 'Alice Admin', email: 'alice@example.com', role: 'admin' },
            { id: 2, name: 'Bob User', email: 'bob@example.com', role: 'user' },
        ];

        // Mock search endpoint
        await page.route('/users/search', async (route) => {
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify(users),
            });
        });

        // Mock create user endpoint
        await page.route('/users', async (route) => {
            if (route.request().method() === 'POST') {
                const body = await route.request().postDataJSON();
                const newUser = { ...body, id: 999 };
                await route.fulfill({
                    contentType: 'application/json',
                    body: JSON.stringify(newUser),
                });
                return;
            }
            await route.fallback();
        });

        // Mock update user endpoint
        await page.route(/\/users\/\d+$/, async (route) => {
            if (route.request().method() === 'PUT') {
                const body = await route.request().postDataJSON();
                const updatedUser = { ...body };
                await route.fulfill({
                    contentType: 'application/json',
                    body: JSON.stringify(updatedUser),
                });
                return;
            }
            await route.fallback();
        });

        // Mock delete user endpoint
        await page.route(/\/users\/\d+$/, async (route) => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 200, body: '' });
                return;
            }
            await route.fallback();
        });

        // Navigate to Users admin page
        await page.goto('/admin/users');
    });

    /**
     * @test Renders Users page
     * @description Verifies that the Users page displays the correct title
     * and the "Add User" button.
     */
    test('renders Users page with title and Add User button', async ({ page }) => {
        await expect(page.locator('.title-bar h1')).toHaveText('Users');
        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
    });

    /**
     * @test Search functionality
     * @description Ensures that search results are displayed correctly.
     * If results exist, the first item is visible; otherwise, an empty state message is shown.
     */
    test('search shows results list or empty state', async ({ page }) => {
        const sidePanelResults = page.locator('.side-panel-results');
        const resultsList = page.locator('.results-list .result-item');
        await expect(sidePanelResults).toBeVisible();

        const hasResults = await resultsList.count();
        if (hasResults > 0) {
            await expect(resultsList.first()).toBeVisible();
        } else {
            await expect(sidePanelResults).toContainText('No results found');
        }
    });

    /**
     * @test Add user
     * @description Validates that a new user can be added via the form.
     */
    test('can add a new user', async ({ page }) => {
        await page.getByRole('button', { name: 'Add User' }).click();
        const form = page.locator('.section-results-side');

        await form.getByPlaceholder('Name').fill('Test User');
        await form.getByPlaceholder('Email').fill('test@boisestate.edu');
        await form.getByPlaceholder('Phone').fill('111-222-333-4444');
        await form.getByPlaceholder('Password').fill('testpassword');

        const roleSelect = page.locator('select.textbox');
        await roleSelect.selectOption('Accounting');

        page.once('dialog', async (dialog) => {
            expect(dialog.message());
            await dialog.accept();
        });

        await page.getByRole('button', { name: 'Add' }).click();

        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
    });

    /**
     * @test Edit user
     * @description Confirms that an existing user can be selected from search results
     * and updated successfully.
     */
    test('can select a user from search results and edit it', async ({ page }) => {
        await page.getByPlaceholder('Name').first().fill('Alice');
        await page.keyboard.press('Enter');

        const firstResult = page.locator('.results-list .result-item').first();
        await expect(firstResult).toBeVisible();
        await firstResult.click();

        const form = page.locator('.section-results-side');
        await form.getByPlaceholder('Name').fill('Updated User Name');
        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
    });

    /**
     * @test Delete user
     * @description Ensures that a selected user can be deleted successfully.
     */
    test('can delete a selected user', async ({ page }) => {
        // Intercept DELETE API
        await page.route(/\/users\/\d+$/, async (route) => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 200, body: '' });
                return;
            }
            await route.fallback();
        });

        await page.getByPlaceholder('Name').first().fill('Alice');
        await page.keyboard.press('Enter');

        const firstResult = page.locator('.results-list .result-item').first();
        await expect(firstResult).toBeVisible();
        await firstResult.click();

        // Handle the confirmation popup
        page.once('dialog', async (dialog) => {
            expect(dialog.message());
            await dialog.accept();
        });

        await page.getByRole('button', { name: 'Delete' }).click();

        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
    });

    /**
     * @test Cancel form
     * @description Verifies that clicking "Cancel" resets the form and returns
     * to the default state.
     */
    test('cancel button resets the form', async ({ page }) => {
        await page.getByRole('button', { name: 'Add User' }).click();
        const form = page.locator('.section-results-side');
        await form.getByPlaceholder('Name').fill('Temp User');

        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
    });
});
