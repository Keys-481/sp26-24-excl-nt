import { expect, test } from '@playwright/test';

/**
 * Configure test context to start with an empty storage state.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Test suite grouping all login page related tests.
 */
test.describe('Login page', () => {

  /**
   * Test case: Verify that the login form renders correctly.
   *
   * @param {import('@playwright/test').Page} page - Playwright page object used to interact with the browser.
   * @param {string} baseURL - Base URL of the application under test, defined in playwright.config.js.
   *
   * Assertions:
   *   Login form container is visible.
   *   Email/identifier input is visible.
   *   Password input is visible.
   *   Submit button is visible.
   */
  test('renders login form', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/login`);

    // Check that form and inputs are visible
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('identifier')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();
    await expect(page.getByTestId('submit')).toBeVisible();
  });

  /**
   * Test case: Verify that an error message is shown when invalid credentials are submitted.
   *
   * @param {import('@playwright/test').Page} page - Playwright page object used to interact with the browser.
   * @param {string} baseURL - Base URL of the application under test.
   *
   * Behavior:
   *   Fills the login form with incorrect email and password.
   *   Intercepts the login API request and returns a 401 Unauthorized response.
   *   Clicks the submit button.
   *
   * Assertions:
   *   Error message element displays "Invalid credentials".
   */
  test('shows error on invalid credentials', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/login`);

    await page.getByTestId('identifier').fill('wrong@example.com');
    await page.getByTestId('password').fill('bad-password');

    // Intercept the login API to simulate failure
    await page.route('/api/auth/login', route =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      })
    );

    await page.getByTestId('submit').click();

    // Expect error message
    await expect(page.getByTestId('error')).toHaveText(/Invalid credentials/i);
  });

  /**
   * Test case: Verify that a successful login redirects to the advisor dashboard.
   *
   * @param {import('@playwright/test').Page} page - Playwright page object used to interact with the browser.
   * @param {string} baseURL - Base URL of the application under test.
   *
   * Behavior:
   *   Fills the login form with advisor credentials.
   *   Intercepts the login API request and returns a 200 OK response with a fake token and advisor role.
   *   Clicks the submit button.
   *
   * Assertions:
   *   Browser URL matches the advisor dashboard path.
   */
  test('redirects to advisor dashboard on successful login', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/login`);

    await page.getByTestId('identifier').fill('advisor2@boisestate.edu');
    await page.getByTestId('password').fill('supersecurehash3');

    // Mock successful login response
    await page.route('/api/auth/login', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-token',
          user: { role: 'advisor', default_view: 2 },
        }),
      })
    );

    await page.getByTestId('submit').click();

    // Expect redirect to advisor dashboard
    await expect(page).toHaveURL(/\/advisor\/dashboard$/);
  });
});
