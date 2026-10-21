import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E tests run against a production build. Phone profiles use WebKit for
 * iPhone (closest to iOS Safari) and Chromium for Android, in both orientations.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone", use: { ...devices["iPhone 17"] } },
    { name: "iphone-landscape", use: { ...devices["iPhone 17 landscape"] } },
    { name: "android", use: { ...devices["Pixel 10"] } },
    { name: "android-landscape", use: { ...devices["Pixel 10 landscape"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
