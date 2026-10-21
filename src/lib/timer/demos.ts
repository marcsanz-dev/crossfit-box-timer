import { workoutSchema, type Workout } from "./schema";

/** Built-in workouts to try the phone timer without a coach account. */
export const DEMO_WORKOUTS = {
  "for-time": workoutSchema.parse({
    mode: "forTime",
    name: "Fran",
    description: "21-15-9\nThrusters (43/29 kg)\nPull-ups",
    capSeconds: 10 * 60,
  }),
  amrap: workoutSchema.parse({
    mode: "amrap",
    name: "Cindy",
    description: "5 pull-ups\n10 push-ups\n15 air squats",
    durationSeconds: 12 * 60,
  }),
  emom: workoutSchema.parse({
    mode: "emom",
    name: "Engine builder",
    intervalSeconds: 60,
    rounds: 10,
    stations: ["12 KB swings", "10 burpees"],
  }),
  quick: workoutSchema.parse({
    mode: "emom",
    name: "Quick test",
    description: "Short EMOM to check the beeps.",
    intervalSeconds: 20,
    rounds: 3,
    prepSeconds: 5,
    stations: ["A", "B", "C"],
  }),
} satisfies Record<string, Workout>;

export type DemoSlug = keyof typeof DEMO_WORKOUTS;

export const DEMO_SLUGS = Object.keys(DEMO_WORKOUTS) as DemoSlug[];

export function isDemoSlug(value: string): value is DemoSlug {
  return Object.hasOwn(DEMO_WORKOUTS, value);
}
