import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for end-to-end testing against a running Next.js
 * dev server. Set credentials via environment variables (see e2e/.env.example
 * or just export them in your shell):
 *
 *   E2E_ADMIN_EMAIL       (default: ali.manhal@adesso.in)
 *   E2E_ADMIN_PASSWORD    (default: admin@1234)
 *   E2E_USER_EMAIL        (default: testuser@example.com)
 *   E2E_USER_PASSWORD     (default: Test@1234)
 *   E2E_BASE_URL          (default: http://localhost:3000)
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // login + prediction tests touch shared DB state
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
