import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// WCAG 2.2 A and AA, the level the plan asks for.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(TAGS)
    .analyze();
  // The summary names each rule and element, so a failure says what to fix.
  expect(
    violations.map((v) => ({
      rule: v.id,
      targets: v.nodes.map((node) => node.target.join(" ")),
    })),
  ).toEqual([]);
}

const PAGES = [
  { name: "home", path: "/" },
  { name: "home (Catalan)", path: "/ca" },
  { name: "coach sign-in", path: "/coach" },
  { name: "coach denied", path: "/coach/denied" },
  { name: "phone home", path: "/t" },
  { name: "demo list", path: "/t/demo" },
  { name: "ready screen", path: "/t/demo/amrap" },
  { name: "code not found", path: "/t/O0O0O0" },
  // The e2e server has no database, so this is the "couldn't load" screen.
  { name: "couldn't load", path: "/t/K7QM4P" },
];

for (const { name, path } of PAGES) {
  for (const scheme of ["light", "dark"] as const) {
    test(`${name} has no WCAG A/AA violations (${scheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expectNoViolations(page);
    });
  }
}

test("the running timer has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("/t/demo/emom");
  await page.getByRole("button", { name: "Empezar" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expectNoViolations(page);
  // With the controls and the stop dialog open, too.
  await page.getByRole("button", { name: "Mostrar controles" }).click();
  await page.getByRole("button", { name: "Parar" }).click();
  await expect(
    page.getByRole("dialog", { name: "¿Parar el entreno?" }),
  ).toBeVisible();
  await expectNoViolations(page);
});
