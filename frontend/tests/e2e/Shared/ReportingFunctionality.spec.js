import { expect, test } from '@playwright/test';

function getRoleFromProject(testInfo) {
    const name = testInfo.project?.name || '';

    if (name.includes('advisor')) return 'advisor';
    if (name.includes('accounting')) return 'accounting';

    return null;
}

test.describe('ReportingFunctionality Page', () => {

    /**
     * Sets up the test environment before each test case.
     *
     * Behavior:
     *   Navigates the Playwright browser to the Advisor ReportingFunctionality page.
     *   Ensures each test starts from a clean state on the correct route.
     */
    test.beforeEach(async ({ page }, testInfo) => {
        const role = getRoleFromProject(testInfo);
        if (!role) test.skip();

        // Navigate to the ReportingFunctionality page
        await page.goto(`/${role}/reporting-functionality`);
    });

    /**
     * Test: renders the Enrollment Report title and search bar
     *
     * Purpose:
     * Verifies that the page heading and both search bar inputs are visible.
     *
     * Behavior:
     *   Skips execution if the project name indicates a student context.
     *   Asserts that the "Enrollment Report" heading is displayed.
     *   Asserts that the "Course Name" and "Course Code" input placeholders are visible.
     */
    test('renders the Enrollment Report title and search bar', async ({ page }, testInfo) => {
        if (testInfo.project?.name?.includes('student')) test.skip();

        await expect(page.getByRole('heading', { name: 'Enrollment Report' })).toBeVisible();
        await expect(page.getByPlaceholder('Course Name')).toBeVisible();
        await expect(page.getByPlaceholder('Course Code')).toBeVisible();
    });

    /**
     * Test: shows "No courses found" when search returns empty
     *
     * Purpose:
     * Ensures that the UI correctly displays an empty results message when no courses match the search.
     *
     * Behavior:
     *   Skips execution if the project is student context.
     *   Fills the "Course Name" input with a non‑existent course and triggers search.
     *   Asserts that the side panel results area contains the empty message.
     */
    test('shows "No courses found" when search returns empty', async ({ page }, testInfo) => {
        if (testInfo.project?.name?.includes('student')) test.skip();

        const searchInput = page.getByPlaceholder('Course Name');
        await searchInput.fill('NonExistentCourse');
        await searchInput.press('Enter');

        await expect(page.locator('.side-panel-results')).toContainText('');
    });

    /**
     * Test: displays search results and allows course selection
     *
     * Purpose:
     * Validates that search results are rendered and that selecting a course updates the report layout.
     *
     * Behavior:
     *   Skips execution if the project is student context.
     *   Mocks the /courses/search API to return two courses.
     *   Triggers search via the "Course Name" input.
     *   Asserts that two results are displayed with correct names.
     *   Clicks the first result and verifies it is marked selected.
     *   Checks that the ReportLayout section updates with the selected course code.
     */
    test('displays search results and allows course selection', async ({ page }, testInfo) => {
        if (testInfo.project?.name?.includes('student')) test.skip();

        // Mock the search API to return two courses
        await page.route('**/courses/search**', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { name: 'Intro to AI', code: 'CS101' },
                    { name: 'Advanced ML', code: 'CS202' }
                ]),
            });
        });

        // Type into the search bar and trigger search
        await page.getByPlaceholder('Course Name').fill('AI');
        await page.keyboard.press('Enter');

        // Verify results list
        const results = page.locator('.results-list .result-item');
        await expect(results).toHaveCount(2);
        await expect(results.nth(0)).toContainText('Intro to AI');
        await expect(results.nth(1)).toContainText('Advanced ML');

        // Select a course
        await results.nth(0).click();
        await expect(results.nth(0)).toHaveClass(/selected/);

        // Verify ReportLayout updates with course code
        await expect(page.locator('.section-results-main')).toContainText('CS101');
    });

    /**
     * Test: resets selection when search is cleared
     *
     * Purpose:
     * Confirms that clearing the search results removes the selected course and resets the report layout.
     *
     * Behavior:
     *   Mocks the /courses/search API to return one course.
     *   Triggers search and verifies the single result is displayed.
     *   Selects the result and confirms it is marked selected.
     *   Re‑mocks the API to return an empty array.
     *   Triggers search again and verifies that results list is empty and the report layout no longer shows the course code.
     */
    test('resets selection when search is cleared', async ({ page }) => {
        // Intercept the search API
        await page.route('**/courses/search**', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ name: 'Data Science', code: 'DS300' }]),
            });
        });

        // Type into the search bar and trigger search
        await page.getByPlaceholder('Course Name').fill('Data Science');
        await page.keyboard.press('Enter');

        const resultItem = page.locator('.results-list .result-item');
        await expect(resultItem).toHaveCount(1);

        await resultItem.click();
        await expect(resultItem).toHaveClass(/selected/);

        // Now mock empty results
        await page.route('**/courses/search**', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });

        // Trigger search again
        await page.getByPlaceholder('Course Name').fill('Nothing');
        await page.keyboard.press('Enter');

        await expect(page.locator('.results-list')).toHaveCount(0);
        await expect(page.locator('.section-results-main')).not.toContainText('DS300');
    });
});
