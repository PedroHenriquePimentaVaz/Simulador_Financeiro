import { defineConfig } from '@playwright/test';

const PORT = 5173;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    port: PORT,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
