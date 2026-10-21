import { describe, expect, it } from "vitest";
import { DEMO_SLUGS, DEMO_WORKOUTS, isDemoSlug } from "./demos";
import { workoutSchema } from "./schema";

describe("demo workouts", () => {
  it("covers the three modes plus a quick test", () => {
    expect(DEMO_SLUGS).toEqual(["for-time", "amrap", "emom", "quick"]);
    const modes = new Set(Object.values(DEMO_WORKOUTS).map((w) => w.mode));
    expect(modes).toEqual(new Set(["forTime", "amrap", "emom"]));
  });

  it.each(DEMO_SLUGS)("%s is a valid workout", (slug) => {
    expect(workoutSchema.safeParse(DEMO_WORKOUTS[slug]).success).toBe(true);
  });

  it("recognises only known slugs", () => {
    expect(isDemoSlug("amrap")).toBe(true);
    expect(isDemoSlug("tabata")).toBe(false);
    expect(isDemoSlug("toString")).toBe(false);
  });
});
