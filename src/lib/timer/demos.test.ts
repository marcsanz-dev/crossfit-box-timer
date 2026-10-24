import { describe, expect, it } from "vitest";
import { DEMO_SLUGS, getDemoWorkout, isDemoSlug } from "./demos";
import { workoutSchema } from "./schema";

const LOCALES = ["es", "en", "ca"] as const;

describe("demo workouts", () => {
  it("covers the three modes plus a quick test and a full hour", () => {
    expect(DEMO_SLUGS).toEqual([
      "for-time",
      "amrap",
      "emom",
      "quick",
      "full-hour",
    ]);
    const modes = new Set(DEMO_SLUGS.map((s) => getDemoWorkout(s, "es").mode));
    expect(modes).toEqual(new Set(["forTime", "amrap", "emom"]));
  });

  it.each(DEMO_SLUGS)("%s is a valid workout in every language", (slug) => {
    for (const locale of LOCALES) {
      expect(
        workoutSchema.safeParse(getDemoWorkout(slug, locale)).success,
      ).toBe(true);
    }
  });

  it.each(DEMO_SLUGS)("%s only changes its texts between languages", (slug) => {
    const strip = (locale: string) => {
      const workout = getDemoWorkout(slug, locale);
      const { name, description, ...timing } = workout;
      const stations = "stations" in timing ? timing.stations.length : 0;
      return {
        ...timing,
        stations,
        hasDescription: !!description,
        hasName: !!name,
      };
    };
    expect(strip("en")).toEqual(strip("es"));
    expect(strip("ca")).toEqual(strip("es"));
  });

  it("is translated", () => {
    expect(getDemoWorkout("quick", "es").name).toBe("Prueba rápida");
    expect(getDemoWorkout("quick", "en").name).toBe("Quick test");
    expect(getDemoWorkout("quick", "ca").name).toBe("Prova ràpida");
  });

  it("falls back to Spanish for an unknown language", () => {
    expect(getDemoWorkout("amrap", "fr")).toEqual(
      getDemoWorkout("amrap", "es"),
    );
  });

  it("recognises only known slugs", () => {
    expect(isDemoSlug("amrap")).toBe(true);
    expect(isDemoSlug("tabata")).toBe(false);
    expect(isDemoSlug("toString")).toBe(false);
  });
});
