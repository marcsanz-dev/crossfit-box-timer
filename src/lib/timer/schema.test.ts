import { describe, expect, it } from "vitest";
import { getWorkSeconds, workoutSchema, type WorkoutInput } from "./schema";

const parse = (input: unknown) => workoutSchema.safeParse(input);

describe("workoutSchema", () => {
  it("accepts a For Time workout and applies defaults", () => {
    const result = parse({ mode: "forTime", capSeconds: 600 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      mode: "forTime",
      capSeconds: 600,
      prepSeconds: 10,
      name: undefined,
      description: undefined,
    });
  });

  it("accepts an AMRAP workout with name and description", () => {
    const result = parse({
      mode: "amrap",
      durationSeconds: 720,
      prepSeconds: 5,
      name: "  Cindy  ",
      description: "5 pull-ups\n10 push-ups\n15 squats",
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: "Cindy",
      prepSeconds: 5,
      durationSeconds: 720,
    });
  });

  it("accepts an EMOM workout and trims stations", () => {
    const result = parse({
      mode: "emom",
      intervalSeconds: 60,
      rounds: 10,
      stations: [" 12 KB swings ", "10 burpees"],
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      stations: ["12 KB swings", "10 burpees"],
      prepSeconds: 10,
    });
  });

  it("defaults EMOM stations to an empty list", () => {
    const result = parse({ mode: "emom", intervalSeconds: 120, rounds: 5 });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ stations: [] });
  });

  it("stores blank text as undefined", () => {
    const result = parse({
      mode: "amrap",
      durationSeconds: 300,
      name: "   ",
      description: "",
    });
    expect(result.data).toMatchObject({
      name: undefined,
      description: undefined,
    });
  });

  it.each<[string, unknown]>([
    ["an unknown mode", { mode: "tabata", durationSeconds: 240 }],
    ["a cap below 1 minute", { mode: "forTime", capSeconds: 59 }],
    ["a cap above 60 minutes", { mode: "forTime", capSeconds: 3601 }],
    ["a non-integer duration", { mode: "amrap", durationSeconds: 90.5 }],
    [
      "a prep time outside the options",
      { mode: "amrap", durationSeconds: 300, prepSeconds: 7 },
    ],
    [
      "an interval that is not a multiple of 5 s",
      { mode: "emom", intervalSeconds: 62, rounds: 5 },
    ],
    ["an interval below 10 s", { mode: "emom", intervalSeconds: 5, rounds: 5 }],
    ["zero rounds", { mode: "emom", intervalSeconds: 60, rounds: 0 }],
    [
      "an EMOM longer than 60 minutes",
      { mode: "emom", intervalSeconds: 120, rounds: 31 },
    ],
    [
      "an empty station",
      { mode: "emom", intervalSeconds: 60, rounds: 5, stations: ["  "] },
    ],
    [
      "too many stations",
      {
        mode: "emom",
        intervalSeconds: 60,
        rounds: 5,
        stations: Array(13).fill("x"),
      },
    ],
    [
      "a name that is too long",
      { mode: "forTime", capSeconds: 600, name: "x".repeat(61) },
    ],
  ])("rejects %s", (_label, input) => {
    expect(parse(input).success).toBe(false);
  });

  it("reports the EMOM total-length error on the rounds field", () => {
    const result = parse({ mode: "emom", intervalSeconds: 600, rounds: 7 });
    expect(result.error?.issues[0]).toMatchObject({
      message: "total_too_long",
      path: ["rounds"],
    });
  });

  it("accepts the 60-minute EMOM limit exactly", () => {
    expect(
      parse({ mode: "emom", intervalSeconds: 60, rounds: 60 }).success,
    ).toBe(true);
  });
});

describe("getWorkSeconds", () => {
  it.each<[WorkoutInput, number]>([
    [{ mode: "forTime", capSeconds: 600 }, 600],
    [{ mode: "amrap", durationSeconds: 720 }, 720],
    [{ mode: "emom", intervalSeconds: 90, rounds: 8 }, 720],
  ])("returns the work length for %o", (input, expected) => {
    expect(getWorkSeconds(workoutSchema.parse(input))).toBe(expected);
  });
});
