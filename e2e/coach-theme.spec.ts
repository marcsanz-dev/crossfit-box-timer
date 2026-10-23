import { expect, test, type Locator } from "@playwright/test";

/** WCAG relative luminance of a CSS rgb()/rgba() colour. */
function luminance(rgb: string): number {
  const [r = 0, g = 0, b = 0] = (rgb.match(/[\d.]+/g) ?? []).map(Number);
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const background = (locator: Locator) =>
  locator.evaluate((el) => getComputedStyle(el).backgroundColor);
const textColor = (locator: Locator) =>
  locator.evaluate((el) => getComputedStyle(el).color);

for (const colorScheme of ["light", "dark"] as const) {
  test(`coach sign-in is readable in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/coach");

    const button = page.getByRole("button", { name: "Entrar con Google" });
    const card = page.locator("section", { has: button });
    await expect(button).toBeVisible();

    // WCAG 1.4.11: the button must stand out from its card (≥ 3:1)…
    expect(
      contrast(await background(button), await background(card)),
    ).toBeGreaterThanOrEqual(3);
    // …and its label must be readable (WCAG 1.4.3, ≥ 4.5:1).
    expect(
      contrast(await textColor(button), await background(button)),
    ).toBeGreaterThanOrEqual(4.5);

    // The theme really follows the system: a dark card in dark mode, light otherwise.
    const cardLuminance = luminance(await background(card));
    if (colorScheme === "dark") expect(cardLuminance).toBeLessThan(0.1);
    else expect(cardLuminance).toBeGreaterThan(0.8);

    const scheme = await page
      .locator('meta[name="color-scheme"]')
      .getAttribute("content");
    expect(scheme).toBe("light dark");
  });
}
