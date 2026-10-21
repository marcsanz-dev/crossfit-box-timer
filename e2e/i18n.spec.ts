import { expect, test } from "@playwright/test";

const cases = [
  { path: "/", lang: "es", title: "Temporizador de CrossFit Box" },
  { path: "/en", lang: "en", title: "CrossFit Box Timer" },
  { path: "/ca", lang: "ca", title: "Temporitzador de CrossFit Box" },
];

for (const { path, lang, title } of cases) {
  test(`home renders in ${lang}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  });
}

test("language switcher changes the locale", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
