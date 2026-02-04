/**
 * File: frontend/tests/e2e/auth.setup.js
 * Playwright test setup file to create authenticated storage state for all users.
 */

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('create storage state for all roles', async ({ browser, baseURL }) => {
    // Define URL and output directory
    const url = baseURL || 'http://localhost:3000';
    const outDir = path.join(process.cwd(), 'tests', 'e2e', '.auth');
    fs.mkdirSync(outDir, { recursive: true });

    const roles = [
        ['admin',      { id: 1, email: 'admin@boisestate.edu',      first_name: 'Admin',   last_name: 'User',   role: 'admin' }],
        ['advisor',    { id: 2, email: 'advisor1@boisestate.edu',   first_name: 'Jane',    last_name: 'Doe',    role: 'advisor' }],
        ['accounting', { id: 3, email: 'acct@boisestate.edu',       first_name: 'Alex',    last_name: 'Numbers',role: 'accounting' }],
        ['student',    { id: 4, email: 'student1@u.boisestate.edu', first_name: 'Alice',   last_name: 'Johnson',role: 'student' }],
    ];

    for (const [name, user] of roles) {
        const context = await browser.newContext();
        const page = await context.newPage();

        // Visit the app to initialize
        await page.goto(url);

        // Seed AuthProvider with advisor credentials
        await page.addInitScript((payload) => {
            localStorage.setItem('auth', JSON.stringify(payload));
        }, {
            isAuthed: true,
            token: 'dev-token',
            user
        });

        // Reload to apply auth state
        await page.reload();

        // Save cookies and local storage to file
        await context.storageState({ path: path.join(outDir, `${name}.json`) });
        await context.close();
    }
});


