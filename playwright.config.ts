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
    // Hermetic placeholders: they override any developer .env.local, so e2e runs
    // never touch a real database or Google client. Pages without a session
    // cookie never query the database.
    env: {
      DATABASE_URL: "postgresql://e2e:e2e@127.0.0.1:5432/e2e",
      BETTER_AUTH_SECRET: "e2e-only-secret-not-used-anywhere-else-000",
      BETTER_AUTH_URL: baseURL,
      GOOGLE_CLIENT_ID: "e2e-client-id",
      GOOGLE_CLIENT_SECRET: "e2e-client-secret",
      AUTH_EXTRA_EMAILS: "",
    },
  },
});
