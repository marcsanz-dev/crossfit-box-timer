import { describe, expect, it } from "vitest";
import { presetIdSchema, savePresetInputSchema } from "./preset";

const fran = { mode: "forTime", name: "Fran", capSeconds: 600 } as const;

describe("savePresetInputSchema", () => {
  it("accepts a named workout, with or without an id", () => {
    expect(savePresetInputSchema.safeParse({ workout: fran }).success).toBe(
      true,
    );
    expect(
      savePresetInputSchema.safeParse({ id: "abc", workout: fran }).success,
    ).toBe(true);
  });

  it("applies the workout defaults", () => {
    const parsed = savePresetInputSchema.parse({ workout: fran });
    expect(parsed.workout).toMatchObject({ prepSeconds: 10 });
  });

  it("rejects a workout without a name, even a blank one", () => {
    for (const name of [undefined, "", "   "]) {
      const result = savePresetInputSchema.safeParse({
        workout: { ...fran, name },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("name_required");
    }
  });

  it("rejects an invalid workout", () => {
    expect(
      savePresetInputSchema.safeParse({ workout: { ...fran, capSeconds: 5 } })
        .success,
    ).toBe(false);
  });
});

describe("presetIdSchema", () => {
  it("rejects empty and oversized ids", () => {
    expect(presetIdSchema.safeParse("").success).toBe(false);
    expect(presetIdSchema.safeParse("x".repeat(65)).success).toBe(false);
    expect(presetIdSchema.safeParse("p_123").success).toBe(true);
  });
});
