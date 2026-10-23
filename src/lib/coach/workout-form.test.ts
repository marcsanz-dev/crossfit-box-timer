import { describe, expect, it } from "vitest";
import {
  INITIAL_FORM_STATE,
  toWorkoutInput,
  validateWorkoutForm,
  type WorkoutFormState,
} from "./workout-form";

const state = (patch: Partial<WorkoutFormState>): WorkoutFormState => ({
  ...INITIAL_FORM_STATE,
  ...patch,
});

describe("toWorkoutInput", () => {
  it("builds a For Time workout with the cap in seconds", () => {
    expect(
      toWorkoutInput(state({ mode: "forTime", capMinutes: 7, capSeconds: 30 })),
    ).toMatchObject({ mode: "forTime", capSeconds: 450, prepSeconds: 10 });
  });

  it("builds an AMRAP and ignores the other modes' fields", () => {
    const input = toWorkoutInput(state({ mode: "amrap", durationMinutes: 12 }));
    expect(input).toMatchObject({ mode: "amrap", durationSeconds: 720 });
    expect(input).not.toHaveProperty("capSeconds");
  });

  it("builds an EMOM and drops blank station rows", () => {
    expect(
      toWorkoutInput(
        state({
          mode: "emom",
          intervalMinutes: 2,
          intervalSeconds: 0,
          rounds: 8,
          stations: [" Burpees ", "", "  ", "Squats"],
        }),
      ),
    ).toMatchObject({
      mode: "emom",
      intervalSeconds: 120,
      rounds: 8,
      stations: ["Burpees", "Squats"],
    });
  });
});

describe("validateWorkoutForm", () => {
  it("accepts the initial state of every mode", () => {
    for (const mode of ["forTime", "amrap", "emom"] as const) {
      expect(validateWorkoutForm(state({ mode })).ok).toBe(true);
    }
  });

  it("returns the validated workout with defaults applied", () => {
    const result = validateWorkoutForm(
      state({ mode: "amrap", name: " Cindy " }),
    );
    expect(result.ok && result.workout).toMatchObject({
      mode: "amrap",
      name: "Cindy",
      durationSeconds: 720,
    });
  });

  it.each<[string, Partial<WorkoutFormState>, Record<string, string>]>([
    [
      "a cap under a minute",
      { mode: "forTime", capMinutes: 0, capSeconds: 30 },
      { cap: "workRange" },
    ],
    [
      "an empty cap",
      { mode: "forTime", capMinutes: Number.NaN },
      { cap: "workRange" },
    ],
    [
      "an AMRAP over 60 minutes",
      { mode: "amrap", durationMinutes: 61 },
      { duration: "workRange" },
    ],
    [
      "an interval that is not a multiple of 5 s",
      { mode: "emom", intervalMinutes: 0, intervalSeconds: 42 },
      { interval: "intervalStep" },
    ],
    [
      "an interval under 10 s",
      { mode: "emom", intervalMinutes: 0, intervalSeconds: 5 },
      { interval: "intervalRange" },
    ],
    ["zero rounds", { mode: "emom", rounds: 0 }, { rounds: "roundsRange" }],
    [
      "an EMOM over 60 minutes",
      { mode: "emom", intervalMinutes: 2, rounds: 31 },
      { rounds: "totalTooLong" },
    ],
    [
      "too many stations",
      { mode: "emom", stations: Array(13).fill("x") },
      { stations: "tooManyStations" },
    ],
    [
      "a station that is too long",
      { mode: "emom", stations: ["x".repeat(81)] },
      { stations: "tooLong" },
    ],
    ["a name that is too long", { name: "x".repeat(61) }, { name: "tooLong" }],
    [
      "a description that is too long",
      { description: "x".repeat(1001) },
      { description: "tooLong" },
    ],
    [
      "an unsupported prep time",
      { prepSeconds: 7 },
      { prepSeconds: "invalid" },
    ],
  ])("flags %s on the right field", (_label, patch, expected) => {
    const result = validateWorkoutForm(state(patch));
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expected);
  });
});
