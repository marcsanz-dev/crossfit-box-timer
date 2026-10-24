import { workoutSchema, type Workout, type WorkoutInput } from "./schema";

/** Built-in workouts to try the phone timer without a coach account. */
const DEMO_TIMINGS = {
  "for-time": { mode: "forTime", capSeconds: 10 * 60 },
  amrap: { mode: "amrap", durationSeconds: 12 * 60 },
  emom: { mode: "emom", intervalSeconds: 60, rounds: 10 },
  quick: { mode: "emom", intervalSeconds: 20, rounds: 3, prepSeconds: 5 },
  // A whole class, untouched: the endurance test for wake lock and audio.
  "full-hour": { mode: "emom", intervalSeconds: 60, rounds: 60 },
} as const satisfies Record<string, WorkoutInput>;

export type DemoSlug = keyof typeof DEMO_TIMINGS;
export type DemoLocale = "es" | "en" | "ca";

interface DemoText {
  name: string;
  description?: string;
  stations?: string[];
}

// What a coach would write in each language. Exercise names that boxes use in
// English (thrusters, burpees, wall balls…) stay in English everywhere.
const DEMO_TEXTS: Record<DemoLocale, Record<DemoSlug, DemoText>> = {
  es: {
    "for-time": {
      name: "Fran",
      description: "21-15-9\nThrusters (43/29 kg)\nDominadas",
    },
    amrap: {
      name: "Cindy",
      description: "5 dominadas\n10 flexiones\n15 sentadillas",
    },
    emom: {
      name: "Trabajo de motor",
      stations: ["12 KB swings", "10 burpees"],
    },
    quick: {
      name: "Prueba rápida",
      description: "EMOM corto para comprobar los pitidos.",
      stations: ["A", "B", "C"],
    },
    "full-hour": {
      name: "Hora completa",
      stations: ["Remo 12 cal", "10 wall balls", "Descanso"],
    },
  },
  en: {
    "for-time": {
      name: "Fran",
      description: "21-15-9\nThrusters (43/29 kg)\nPull-ups",
    },
    amrap: {
      name: "Cindy",
      description: "5 pull-ups\n10 push-ups\n15 air squats",
    },
    emom: { name: "Engine builder", stations: ["12 KB swings", "10 burpees"] },
    quick: {
      name: "Quick test",
      description: "Short EMOM to check the beeps.",
      stations: ["A", "B", "C"],
    },
    "full-hour": {
      name: "Full hour",
      stations: ["Row 12 cal", "10 wall balls", "Rest"],
    },
  },
  ca: {
    "for-time": {
      name: "Fran",
      description: "21-15-9\nThrusters (43/29 kg)\nDominades",
    },
    amrap: {
      name: "Cindy",
      description: "5 dominades\n10 flexions\n15 esquats",
    },
    emom: {
      name: "Treball de motor",
      stations: ["12 KB swings", "10 burpees"],
    },
    quick: {
      name: "Prova ràpida",
      description: "EMOM curt per comprovar els xiulets.",
      stations: ["A", "B", "C"],
    },
    "full-hour": {
      name: "Hora completa",
      stations: ["Rem 12 cal", "10 wall balls", "Descans"],
    },
  },
};

export const DEMO_SLUGS = Object.keys(DEMO_TIMINGS) as DemoSlug[];
const DEMO_LOCALES = Object.keys(DEMO_TEXTS) as DemoLocale[];

// Parsed once, so a broken demo fails at startup (and in the unit tests).
const DEMO_WORKOUTS = Object.fromEntries(
  DEMO_LOCALES.map((locale) => [
    locale,
    Object.fromEntries(
      DEMO_SLUGS.map((slug) => [
        slug,
        workoutSchema.parse({
          ...DEMO_TIMINGS[slug],
          ...DEMO_TEXTS[locale][slug],
        }),
      ]),
    ),
  ]),
) as Record<DemoLocale, Record<DemoSlug, Workout>>;

export function isDemoSlug(value: string): value is DemoSlug {
  return Object.hasOwn(DEMO_TIMINGS, value);
}

/** The demo in the page's language (Spanish for an unknown locale). */
export function getDemoWorkout(slug: DemoSlug, locale: string): Workout {
  const known = (DEMO_LOCALES as string[]).includes(locale);
  return DEMO_WORKOUTS[known ? (locale as DemoLocale) : "es"][slug];
}
