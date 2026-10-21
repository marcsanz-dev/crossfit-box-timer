import { z } from "zod";

/** Validation limits shared by the coach form, the server and the phone. */
export const LIMITS = {
  minWorkSeconds: 60,
  maxWorkSeconds: 60 * 60,
  nameMaxLength: 60,
  descriptionMaxLength: 1000,
  emom: {
    minIntervalSeconds: 10,
    maxIntervalSeconds: 10 * 60,
    intervalStepSeconds: 5,
    minRounds: 1,
    maxRounds: 60,
    maxStations: 12,
    stationMaxLength: 80,
  },
} as const;

export const PREP_SECONDS_OPTIONS = [0, 5, 10, 15, 20] as const;
export const DEFAULT_PREP_SECONDS = 10;

/** Trimmed optional text; an empty string is stored as `undefined`. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const workSeconds = z
  .int()
  .min(LIMITS.minWorkSeconds)
  .max(LIMITS.maxWorkSeconds);

const common = {
  name: optionalText(LIMITS.nameMaxLength),
  description: optionalText(LIMITS.descriptionMaxLength),
  prepSeconds: z.literal(PREP_SECONDS_OPTIONS).default(DEFAULT_PREP_SECONDS),
};

export const forTimeSchema = z.object({
  mode: z.literal("forTime"),
  ...common,
  capSeconds: workSeconds,
});

export const amrapSchema = z.object({
  mode: z.literal("amrap"),
  ...common,
  durationSeconds: workSeconds,
});

export const emomSchema = z
  .object({
    mode: z.literal("emom"),
    ...common,
    intervalSeconds: z
      .int()
      .min(LIMITS.emom.minIntervalSeconds)
      .max(LIMITS.emom.maxIntervalSeconds)
      .multipleOf(LIMITS.emom.intervalStepSeconds),
    rounds: z.int().min(LIMITS.emom.minRounds).max(LIMITS.emom.maxRounds),
    /** Exercises that cycle one per interval (A, B, C, A, B, C…). */
    stations: z
      .array(z.string().trim().min(1).max(LIMITS.emom.stationMaxLength))
      .max(LIMITS.emom.maxStations)
      .default([]),
  })
  .refine(
    (emom) => emom.intervalSeconds * emom.rounds <= LIMITS.maxWorkSeconds,
    { message: "total_too_long", path: ["rounds"] },
  );

export const workoutSchema = z.discriminatedUnion("mode", [
  forTimeSchema,
  amrapSchema,
  emomSchema,
]);

/** What a form or API sends (defaults still optional). */
export type WorkoutInput = z.input<typeof workoutSchema>;
/** A validated workout with defaults applied. */
export type Workout = z.output<typeof workoutSchema>;
export type WorkoutMode = Workout["mode"];
export type ForTimeWorkout = z.output<typeof forTimeSchema>;
export type AmrapWorkout = z.output<typeof amrapSchema>;
export type EmomWorkout = z.output<typeof emomSchema>;

/** Length of the work part (excluding prep), in seconds. */
export function getWorkSeconds(workout: Workout): number {
  switch (workout.mode) {
    case "forTime":
      return workout.capSeconds;
    case "amrap":
      return workout.durationSeconds;
    case "emom":
      return workout.intervalSeconds * workout.rounds;
  }
}
