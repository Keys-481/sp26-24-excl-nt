import { expect, test } from '@playwright/test';
import { chromium } from 'playwright';

test.describe('ErrorMessage component integration', () => {

  test('Login error shows icon, label and red color', async ({baseURL}) => {
    // Run login test in a fresh context (no storageState)
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(`${baseURL}/login`);

    await page.waitForSelector('[data-testid="identifier"]', { timeout: 10000 });
    await page.getByTestId('identifier').fill('nope');
    await page.getByTestId('password').fill('wrong');
    await page.getByTestId('submit').click();

    const alert = page.getByTestId('error');
    await expect(alert).toBeVisible({ timeout: 10000 });

    // Should include explicit label
    await expect(alert).toContainText(/Error:/i);

    // Should include an inline SVG icon
    const svg = alert.locator('svg');
    await expect(svg).toHaveCount(1);

    // Login variant uses plain red color
    const color = await alert.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 0, 0)');

    await browser.close();
  });

  test('Advisor page shows "No student selected" message when no student is selected', async ({ page, baseURL }, testInfo) => {
    if (!testInfo.project?.name?.includes('advisor')) test.skip();

    // Visit advisor page with no student selected
    await page.goto(`${baseURL}/advisor/advising`);

    // Check for the message in ProgramSelector
    const msg = await page.locator('text=No student selected').first();
    await expect(msg).toBeVisible({ timeout: 10000 });
  });

});
