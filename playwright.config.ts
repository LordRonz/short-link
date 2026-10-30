import { resolve } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'yarn build && yarn start:ci',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      CI: 'true',
      NEXT_TELEMETRY_DISABLED: '1',
      COOKIE_PASS: 'playwright-only-cookie-password-at-least-32-chars',
      BETTER_AUTH_SECRET: 'playwright-only-auth-secret-at-least-32-chars',
      BETTER_AUTH_URL: baseURL,
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/unused',
      NOTION_INTEGRATION_SECRET: 'playwright-only-notion-token',
      NEXT_PUBLIC_NOTION_LINK_DATABASE_ID: 'e2e-links-database',
      NEXT_PUBLIC_NOTION_TREE_DATABASE_ID: 'e2e-tree-database',
      NODE_OPTIONS: [
        process.env.NODE_OPTIONS,
        `--require="${resolve('tests/e2e/mock-notion.cjs')}"`,
      ]
        .filter(Boolean)
        .join(' '),
    },
  },
});
