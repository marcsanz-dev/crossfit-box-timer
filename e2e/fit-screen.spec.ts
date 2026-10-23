import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Rule: every phone timer screen fits the viewport exactly, on any device and
 * in both orientations, with nothing cut off and no scrolling.
 * Real phones have safe areas (camera cut-outs, gesture bars) that the
 * emulated devices lack, so Chromium projects emulate them via CDP.
 */

const INSETS = {
  portrait: { top: 44, bottom: 28, left: 0, right: 0 },
  landscape: { top: 0, bottom: 20, left: 44, right: 0 },
};

async function emulateSafeArea(page: Page, browserName: string) {
  // CDP is Chromium-only; WebKit runs without insets (still checks the layout).
  if (browserName !== "chromium") return;
  const viewport = page.viewportSize();
  const isLandscape = viewport ? viewport.width > viewport.height : false;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: isLandscape ? INSETS.landscape : INSETS.portrait,
  });
}

async function expectNoScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      x: root.scrollWidth - root.clientWidth,
      y: root.scrollHeight - root.clientHeight,
    };
  });
  expect(overflow).toEqual({ x: 0, y: 0 });
}

/** The element is entirely inside the viewport (not cut by any edge). */
async function expectFullyVisible(locator: Locator) {
  const page = locator.page();
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();
  expect(box, `${locator} has no box`).not.toBeNull();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);
}

test.beforeEach(async ({ page, browserName }) => {
  await page.clock.install({ time: new Date("2026-10-26T18:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-26T18:00:01Z"));
  await emulateSafeArea(page, browserName);
});

test("phone home and 'not found' fit, with safe areas", async ({ page }) => {
  // No timer here: let time flow, or React can't finish streaming the page in.
  await page.clock.resume();
  await page.goto("/t");
  await expectNoScroll(page);
  await expectFullyVisible(
    page.getByRole("textbox", { name: "Código del entreno" }),
  );
  await expectFullyVisible(page.getByRole("button", { name: "Abrir" }));
  await expectFullyVisible(
    page.getByRole("link", { name: "Entrenos de prueba" }),
  );

  await page.goto("/t/O0O0O0");
  await expectNoScroll(page);
  await expectFullyVisible(
    page.getByRole("link", { name: "Probar otro código" }),
  );
});

for (const slug of ["amrap", "emom", "for-time", "full-hour"]) {
  test(`${slug}: every screen fits, with safe areas`, async ({ page }) => {
    await page.goto(`/t/demo/${slug}`);

    // Ready screen: the Start button and the checklist are fully visible.
    await expectNoScroll(page);
    await expectFullyVisible(page.getByRole("button", { name: "Empezar" }));
    await expectFullyVisible(
      page.getByRole("heading", { name: "Antes de empezar" }),
    );
    await page.getByRole("button", { name: "Empezar" }).click();

    // Running: clock, progress bar and the last line of details.
    await page.clock.fastForward(12_000);
    await page.clock.runFor(50);
    await expectNoScroll(page);
    await expectFullyVisible(page.getByRole("timer"));
    await expectFullyVisible(page.getByRole("progressbar"));

    // Controls open: every button is complete on screen.
    await page.getByRole("button", { name: "Mostrar controles" }).click();
    for (const name of ["Pausar", "Reiniciar", "Parar"]) {
      await expectFullyVisible(page.getByRole("button", { name }));
    }
    await expectNoScroll(page);
    await expectFullyVisible(page.getByRole("timer"));
    await page.screenshot({ path: test.info().outputPath("controls.png") });

    // Portrait has room for everything: the controls take their own space and
    // cover neither the details nor the progress bar. (Landscape may float the
    // controls over the details, so the clock keeps its size.)
    const viewport = page.viewportSize();
    if (viewport && viewport.height > viewport.width) {
      const controlsTop = Math.min(
        ...(await Promise.all(
          ["Pausar", "Reiniciar", "Parar"].map(async (name) => {
            const box = await page.getByRole("button", { name }).boundingBox();
            return box?.y ?? 0;
          }),
        )),
      );
      const covered = [page.getByRole("progressbar"), page.getByRole("timer")];
      const details = page.locator("footer p:visible").last();
      if ((await details.count()) > 0) covered.push(details);
      for (const locator of covered) {
        const box = await locator.boundingBox();
        expect(box, `${locator} has no box`).not.toBeNull();
        if (box) expect(box.y + box.height).toBeLessThanOrEqual(controlsTop);
      }
    }

    // Confirmation dialog fits too.
    await page.getByRole("button", { name: "Parar" }).click();
    const dialog = page.getByRole("dialog");
    await expectFullyVisible(dialog);
    await dialog.getByRole("button", { name: "Seguir" }).click();
  });
}
