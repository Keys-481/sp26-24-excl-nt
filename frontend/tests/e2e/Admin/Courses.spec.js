/**
 * End-to-End Tests for the Admin Courses Page
 *
 * File: tests/e2e/Admin/Courses.spec.js
 * Framework: Playwright
 *
 * This suite validates the functionality of the Admin Courses page,
 * including rendering, searching, adding, editing, deleting, and
 * canceling course operations. All backend interactions are mocked
 * to ensure deterministic behavior.
 */
import { expect, test } from '@playwright/test';

test.describe('AdminCourses page', () => {
    
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
     * - /courses/search → returns predefined course list
     * - /courses (POST) → creates a new course with normalized offerings/prerequisites
     * - /courses/{id} (POST) → updates an existing course
     * - /courses/{id} (DELETE) → deletes a course
     *
     * @param page Playwright page instance
     * @effect Navigates to /admin/courses after route setup
     */
    test.beforeEach(async ({ page }) => {
        const courses = [
            {
                id: 1,
                name: 'Instructional Design',
                code: 'OPWL-530',
                credits: 3,
                offerings: ['FA', 'SP'],
                prerequisites: [],
            },
            {
                id: 2,
                name: 'Needs Assessment',
                code: 'OPWL-536',
                credits: 3,
                offerings: ['SP'],
                prerequisites: [{ course_code: 'OPWL-530' }],
            },
        ];

        // Search endpoint
        await page.route('/courses/search', async (route) => {
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify(courses),
            });
        });

        // Create course
        await page.route('/courses', async (route) => {
            const body = await route.request().postDataJSON();
            const newCourse = {
                ...body,
                id: 999,
                offerings: typeof body.offerings === 'string'
                    ? body.offerings.split(',').map((s) => s.trim())
                    : body.offerings || [],
                prerequisites: typeof body.prerequisites === 'string'
                    ? body.prerequisites.split(',').map((s) => ({ course_code: s.trim() }))
                    : body.prerequisites || [],
            };
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify(newCourse),
            });
        });

        // Update course
        await page.route(/\/courses\/\d+$/, async (route) => {
            const body = await route.request().postDataJSON();
            const updated = {
                ...body,
                offerings: typeof body.offerings === 'string'
                    ? body.offerings.split(',').map((s) => s.trim())
                    : body.offerings || [],
                prerequisites: typeof body.prerequisites === 'string'
                    ? body.prerequisites.split(',').map((s) => ({ course_code: s.trim() }))
                    : body.prerequisites || [],
            };
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify(updated),
            });
        });

        // Delete course
        await page.route(/\/courses\/\d+$/, async (route) => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 200, body: '' });
                return;
            }
            await route.fallback();
        });

        await page.goto('/admin/courses');
    });

    /**
     * Verifies that the Courses page renders correctly.
     *
     * Assertions:
     * - Title bar contains "Courses"
     * - "Add Course" button is visible
     */
    test('renders Courses page with title and Add Course button', async ({ page }) => {
        await expect(page.locator('.title-bar h1')).toHaveText('Courses');
        await expect(page.getByRole('button', { name: 'Add Course' })).toBeVisible();
    });

    /**
     * Validates search functionality.
     *
     * Behavior:
     * - Displays side panel results
     * - Shows either a list of results or "No results found" message
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
     * Tests adding a new course.
     *
     * Steps:
     * - Click "Add Course"
     * - Fill in course details (name, code, credits, offerings, prerequisites)
     * - Submit form
     *
     * Assertion:
     * - "Add Course" button is visible again after submission
     */
    test('can add a new course', async ({ page }) => {
        await page.getByRole('button', { name: 'Add Course' }).click();
        const form = page.locator('.section-results-side');

        await form.getByPlaceholder('Course Name').fill('Test Course');
        await form.getByPlaceholder('Course Code').fill('TC101');
        await form.getByPlaceholder('Course Credits').fill('3');
        await form.getByPlaceholder('Course Offerings').fill('FA, SP');
        await form.getByPlaceholder('e.g. OPWL-536, OPWL-530').fill('OPWL-530');

        // Handle the confirmation popup
        page.once('dialog', async (dialog) => {
            expect(dialog.message());
            await dialog.accept();
        });

        await page.getByRole('button', { name: 'Add' }).click();

        await expect(page.getByRole('button', { name: 'Add Course' })).toBeVisible();
    });

    /**
     * Tests editing an existing course.
     *
     * Steps:
     * - Search for "Instructional Design"
     * - Select first result
     * - Update course name
     * - Save changes
     *
     * Assertion:
     * - "Add Course" button is visible after save
     */
    test('can select a course from search results and edit it', async ({ page }) => {
        await page.getByPlaceholder('Course Name').first().fill('Instructional Design');
        await page.keyboard.press('Enter');

        const firstResult = page.locator('.results-list .result-item').first();
        await expect(firstResult).toBeVisible();
        await firstResult.click();

        const form = page.locator('.section-results-side');
        await form.getByPlaceholder('Course Name').fill('Updated Course Name');
        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByRole('button', { name: 'Add Course' })).toBeVisible();
    });

    /**
     * Tests deleting a course.
     *
     * Steps:
     * - Search for "Instructional Design"
     * - Select first result
     * - Confirm deletion in dialog
     * - Click "Delete"
     *
     * Assertion:
     * - "Add Course" button is visible after deletion
     */
    test('can delete a selected course', async ({ page }) => {
        await page.getByPlaceholder('Course Name').first().fill('Instructional Design');
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

        await expect(page.getByRole('button', { name: 'Add Course' })).toBeVisible();
    });

    /**
     * Tests canceling form input.
     *
     * Steps:
     * - Click "Add Course"
     * - Fill in temporary course name
     * - Click "Cancel"
     *
     * Assertion:
     * - "Add Course" button is visible after cancel
     */
    test('cancel button resets the form', async ({ page }) => {
        await page.getByRole('button', { name: 'Add Course' }).click();
        const form = page.locator('.section-results-side');
        await form.getByPlaceholder('Course Name').fill('Temp Course');

        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('button', { name: 'Add Course' })).toBeVisible();
    });
});
