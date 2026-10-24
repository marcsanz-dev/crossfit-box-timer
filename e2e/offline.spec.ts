import { expect, test, type Page } from "@playwright/test";

const PAGES_CACHE = "pages-v1";

/** Whether the service worker has stored `path` for offline use. */
function isStored(page: Page, path: string) {
  return page.evaluate(
    async ([cacheName, url]) => {
      const cache = await caches.open(cacheName);
      return (await cache.match(url)) !== undefined;
    },
    [PAGES_CACHE, new URL(path, page.url()).href] as const,
  );
}

test("each phone page installs as itself", async ({ page, request }) => {
  for (const [path, lang] of [
    ["/t", "es"],
    ["/en/t/demo/quick", "en"],
  ] as const) {
    await page.goto(path);
    const href = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    expect(href).toBeTruthy();
    const response = await request.get(href!);
    expect(response.headers()["content-type"]).toContain(
      "application/manifest+json",
    );
    expect(await response.json()).toMatchObject({
      start_url: path,
      id: path,
      lang,
      display: "standalone",
    });
  }
});

test.describe("offline reload", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Playwright runs service workers on Chromium only",
  );

  test("a phone page loaded once reloads and starts with no network", async ({
    page,
    context,
  }) => {
    await page.goto("/t/demo/quick");
    await expect(page.getByRole("button", { name: "Empezar" })).toBeEnabled();
    await expect.poll(() => isStored(page, "/t/demo/quick")).toBe(true);

    await context.setOffline(true);
    await page.reload();
    // Enabled means the page hydrated: its scripts came from the cache too.
    const start = page.getByRole("button", { name: "Empezar" });
    await expect(start).toBeEnabled();
    await start.click();
    await expect(page.getByRole("timer")).toBeVisible();
    await context.setOffline(false);
  });

  test("a 'couldn't load' page is never stored for offline use", async ({
    page,
  }) => {
    // The e2e server has no reachable database, so /t/CODE fails to load.
    await page.goto("/t/demo/quick");
    await expect.poll(() => isStored(page, "/t/demo/quick")).toBe(true);
    await page.goto("/t/K7QM4P");
    await expect(
      page.getByRole("heading", { name: "No se ha podido cargar" }),
    ).toBeVisible();
    // Give the worker time to (not) store it.
    await page.waitForTimeout(1000);
    expect(await isStored(page, "/t/K7QM4P")).toBe(false);
  });
});
