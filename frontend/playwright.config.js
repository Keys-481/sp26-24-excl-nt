// ESM config
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const FRONTEND_PORT = process.env.FRONTEND_PORT ? Number(process.env.FRONTEND_PORT) : 5173;
const BACKEND_PORT = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 3000;
const HOST = process.env.HOST || '127.0.0.1';
const BASE_URL = process.env.BASE_URL || `http://${HOST}:${BACKEND_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  webServer: [
    {
      command: `npm run db:setup --prefix ../backend && npm start --prefix ../backend -- --port ${BACKEND_PORT} --host ${HOST}`,
      url: `http://${HOST}:${BACKEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
    },
  ],

  projects: [
    // Setup project to create auth storage states
    { name: 'setup-auth', testMatch: /auth\.setup\.[jt]s/ },

    // Projects for each role
    {
      name: 'chromium-admin',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/admin.json' },
      dependencies: ['setup-auth'],
    },
    {
      name: 'chromium-advisor',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/advisor.json' },
      dependencies: ['setup-auth'],
    },
    {
      name: 'chromium-accounting',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/accounting.json' },
      dependencies: ['setup-auth'],
    },
    {
      name: 'chromium-student',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/student.json' },
      dependencies: ['setup-auth'],
    },
  ],
});