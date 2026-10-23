import { expect, test } from "@playwright/test";

test("the phone home opens a typed code, normalised", async ({ page }) => {
  await page.goto("/t");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Temporizador",
  );

  const input = page.getByRole("textbox", { name: "Código del entreno" });
  await input.fill("k7q m4p");
  await page.getByRole("button", { name: "Abrir" }).click();
  await expect(page).toHaveURL(/\/t\/K7QM4P$/);
  // The e2e server has no reachable database, which doubles as an outage test:
  // the phone explains the problem and offers a retry instead of a blank screen.
  await expect(
    page.getByRole("heading", { name: "No se ha podido cargar" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Reintentar" })).toHaveAttribute(
    "href",
    "/t/K7QM4P",
  );
});

test("the phone home rejects a malformed code without leaving", async ({
  page,
}) => {
  await page.goto("/t");
  await page.getByRole("textbox", { name: "Código del entreno" }).fill("12");
  await page.getByRole("button", { name: "Abrir" }).click();
  await expect(page.getByText("El código tiene 6 caracteres")).toBeVisible();
  await expect(page).toHaveURL(/\/t$/);
});

test("a malformed code in the URL shows 'not found' without a database query", async ({
  page,
}) => {
  await page.goto("/t/O0O0O0");
  await expect(
    page.getByRole("heading", { name: "Código no encontrado" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Probar otro código" }).click();
  await expect(page).toHaveURL(/\/t$/);
});

test("once loaded, the timer runs with the network off", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-26T18:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-26T18:00:01Z"));
  await page.goto("/t/demo/quick");
  await expect(page.getByRole("button", { name: "Empezar" })).toBeEnabled();

  await context.setOffline(true);
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.clock.fastForward(5_000 + 25_000);
  await page.clock.runFor(50);
  await expect(page.getByText("Ronda 2 / 3")).toBeVisible();
  await expect(page.getByRole("timer")).toHaveText("15");
  await context.setOffline(false);
});
