import { expect, test, type Page } from "@playwright/test";

/** The running screen must fit the viewport exactly: no scrolling on the rig. */
async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      x: root.scrollWidth - root.clientWidth,
      y: root.scrollHeight - root.clientHeight,
    };
  });
  expect(overflow).toEqual({ x: 0, y: 0 });

  const viewport = page.viewportSize();
  const box = await page.getByRole("timer").boundingBox();
  expect(box).not.toBeNull();
  if (box && viewport) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
}

const T0 = new Date("2026-10-26T18:00:00Z").getTime();

/**
 * Moves fake time forward.
 * - It jumps (`fastForward`) instead of running every animation frame, which
 *   is far too slow for minutes of workout.
 * - The extra 50 ms then lets a few frames paint the new state.
 */
async function advance(page: Page, ms: number) {
  await page.clock.fastForward(ms);
  await page.clock.runFor(50);
}

// Fake time that only moves when a test says so, so assertions are deterministic.
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.clock.pauseAt(T0 + 1_000);
});

test("lists the demo workouts", async ({ page }) => {
  await page.goto("/t/demo");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Entrenos de prueba",
  );
  await expect(page.getByRole("link")).toHaveCount(5);
});

test("runs an EMOM: prep, intervals, rounds and stations", async ({
  page,
}, testInfo) => {
  await page.goto("/t/demo/quick");
  await page.getByRole("button", { name: "Empezar" }).click();

  const timer = page.getByRole("timer");
  await expect(timer).toHaveText("5");
  await expect(page.getByText("Prepárate")).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("1-prep.png") });

  await advance(page, 5_000);
  await expect(timer).toHaveText("20");
  await expect(page.getByText("Ronda 1 / 3")).toBeVisible();
  await expect(page.getByText("A", { exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("2-go.png") });

  await advance(page, 8_000);
  await expect(timer).toHaveText("12");

  await advance(page, 12_000);
  await expect(page.getByText("Ronda 2 / 3")).toBeVisible();
  await expect(timer).toHaveText("20");
  await page.screenshot({ path: testInfo.outputPath("3-round-2.png") });

  await advance(page, 40_000);
  await expect(timer).toHaveText("FIN");
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("4-finished.png") });
});

test("For Time counts up and shows the time to the cap", async ({
  page,
}, testInfo) => {
  await page.goto("/t/demo/for-time");
  await page.getByRole("button", { name: "Empezar" }).click();
  await advance(page, 10_000 + 65_000);

  await expect(page.getByRole("timer")).toHaveText("01:05");
  await expect(page.getByText("Cap en 8:55")).toBeVisible();
  await expect(page.getByText("FOR TIME · CAP 10:00")).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("for-time.png") });

  await advance(page, 600_000);
  await expect(page.getByRole("timer")).toHaveText("10:00");
  await expect(page.getByText("TIME CAP")).toBeVisible();
});

test("AMRAP counts down from the full duration", async ({ page }, testInfo) => {
  await page.goto("/t/demo/amrap");
  await page.getByRole("button", { name: "Empezar" }).click();
  await advance(page, 10_000);
  await expect(page.getByRole("timer")).toHaveText("12:00");
  await advance(page, 61_000);
  await expect(page.getByRole("timer")).toHaveText("10:59");
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("amrap.png") });
});

test("shows every exercise line without truncating it", async ({ page }) => {
  await page.goto("/t/demo/amrap");
  await page.getByRole("button", { name: "Empezar" }).click();
  await advance(page, 10_000);

  const description = page.locator("span:visible", {
    hasText: "15 sentadillas",
  });
  await expect(description).toBeVisible();
  await expect(description).toContainText("5 dominadas");
  // A clamped element scrolls internally: its content would be taller than its box.
  const clipped = await description.evaluate(
    (el) => el.scrollHeight > el.clientHeight + 1,
  );
  expect(clipped).toBe(false);
});

test("resumes at the right second after a reload", async ({ page }) => {
  await page.goto("/t/demo/quick");
  await page.getByRole("button", { name: "Empezar" }).click();
  await advance(page, 5_000 + 25_000);
  await expect(page.getByText("Ronda 2 / 3")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Ronda 2 / 3")).toBeVisible();
  await expect(page.getByRole("timer")).toHaveText("15");

  // Audio needs a new tap after a reload; the clock keeps running meanwhile.
  const soundButton = page.getByRole("button", {
    name: /reactivar el sonido/,
  });
  await expect(soundButton).toBeVisible();
  await soundButton.click();
  // Playwright's WebKit on Windows has no Web Audio, so the prompt rightly stays.
  const hasWebAudio = await page.evaluate(() => "AudioContext" in window);
  if (hasWebAudio) await expect(soundButton).toBeHidden();
  else await expect(page.getByRole("timer")).toHaveText("15");
});

test("hidden controls pause, and stop asks for confirmation", async ({
  page,
}, testInfo) => {
  await page.goto("/t/demo/amrap");
  await page.getByRole("button", { name: "Empezar" }).click();
  await advance(page, 20_000);

  await expect(page.getByRole("button", { name: "Pausar" })).toBeHidden();
  await page.getByRole("button", { name: "Mostrar controles" }).click();
  await page.getByRole("button", { name: "Pausar" }).click();
  await expect(page.getByText("En pausa")).toBeVisible();
  const frozen = await page.getByRole("timer").textContent();
  await advance(page, 10_000);
  await expect(page.getByRole("timer")).toHaveText(frozen ?? "");
  await page.screenshot({ path: testInfo.outputPath("paused.png") });

  await page.getByRole("button", { name: "Parar" }).click();
  const dialog = page.getByRole("dialog", { name: "¿Parar el entreno?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Seguir" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("En pausa")).toBeVisible();

  await page.getByRole("button", { name: "Parar" }).click();
  await dialog.getByRole("button", { name: "Parar" }).click();
  await expect(page.getByRole("button", { name: "Empezar" })).toBeVisible();
});

test("controls hide themselves after a few seconds", async ({ page }) => {
  await page.goto("/t/demo/amrap");
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.getByRole("button", { name: "Mostrar controles" }).click();
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  await advance(page, 6_000);
  await expect(page.getByRole("button", { name: "Pausar" })).toBeHidden();
});

test("a second tap hides the controls at once", async ({ page }) => {
  await page.goto("/t/demo/amrap");
  await page.getByRole("button", { name: "Empezar" }).click();

  await page.getByRole("button", { name: "Mostrar controles" }).click();
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();

  // No time passes: the controls must hide on the tap, not on the timeout.
  // Tap a free area, like a person would: below the wake-lock alert that headless
  // Chromium shows at the top, and above the bottom stack (controls, plus the sound
  // prompt that WebKit without Web Audio shows).
  const { height } = page.viewportSize() ?? { height: 800 };
  await page
    .getByRole("button", { name: "Ocultar controles" })
    .click({ position: { x: 20, y: Math.round(height * 0.35) } });
  await expect(page.getByRole("button", { name: "Pausar" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Mostrar controles" }),
  ).toHaveAttribute("aria-expanded", "false");
});
