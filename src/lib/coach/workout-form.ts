import {
  DEFAULT_PREP_SECONDS,
  LIMITS,
  workoutSchema,
  type Workout,
  type WorkoutInput,
  type WorkoutMode,
} from "@/lib/timer/schema";

/**
 * What the coach form holds while editing. Durations are split into minutes
 * and seconds, like a stopwatch. Number fields may be NaN while an input is
 * empty; the schema then reports them as invalid.
 */
export interface WorkoutFormState {
  mode: WorkoutMode;
  name: string;
  description: string;
  prepSeconds: number;
  capMinutes: number;
  capSeconds: number;
  durationMinutes: number;
  durationSeconds: number;
  intervalMinutes: number;
  intervalSeconds: number;
  rounds: number;
  stations: string[];
}

export const INITIAL_FORM_STATE: WorkoutFormState = {
  mode: "forTime",
  name: "",
  description: "",
  prepSeconds: DEFAULT_PREP_SECONDS,
  capMinutes: 10,
  capSeconds: 0,
  durationMinutes: 12,
  durationSeconds: 0,
  intervalMinutes: 1,
  intervalSeconds: 0,
  rounds: 10,
  stations: [""],
};

export type FormField =
  | "name"
  | "description"
  | "prepSeconds"
  | "cap"
  | "duration"
  | "interval"
  | "rounds"
  | "stations";

export type FormErrorCode =
  | "workRange"
  | "intervalRange"
  | "intervalStep"
  | "roundsRange"
  | "totalTooLong"
  | "tooLong"
  | "tooManyStations"
  | "invalid";

export type FieldErrors = Partial<Record<FormField, FormErrorCode>>;

const toSeconds = (minutes: number, seconds: number) => minutes * 60 + seconds;

/** Only the fields of the selected mode, with blank station rows dropped. */
export function toWorkoutInput(state: WorkoutFormState): WorkoutInput {
  const common = {
    name: state.name,
    description: state.description,
    prepSeconds: state.prepSeconds as WorkoutInput["prepSeconds"],
  };
  switch (state.mode) {
    case "forTime":
      return {
        ...common,
        mode: "forTime",
        capSeconds: toSeconds(state.capMinutes, state.capSeconds),
      };
    case "amrap":
      return {
        ...common,
        mode: "amrap",
        durationSeconds: toSeconds(
          state.durationMinutes,
          state.durationSeconds,
        ),
      };
    case "emom":
      return {
        ...common,
        mode: "emom",
        intervalSeconds: toSeconds(
          state.intervalMinutes,
          state.intervalSeconds,
        ),
        rounds: state.rounds,
        stations: state.stations.map((s) => s.trim()).filter(Boolean),
      };
  }
}

const splitSeconds = (total: number) => ({
  minutes: Math.floor(total / 60),
  seconds: total % 60,
});

/** The form showing a saved workout, so a coach can load a preset and edit it. */
export function formStateFromWorkout(workout: Workout): WorkoutFormState {
  const state: WorkoutFormState = {
    ...INITIAL_FORM_STATE,
    mode: workout.mode,
    name: workout.name ?? "",
    description: workout.description ?? "",
    prepSeconds: workout.prepSeconds,
  };
  switch (workout.mode) {
    case "forTime": {
      const { minutes, seconds } = splitSeconds(workout.capSeconds);
      return { ...state, capMinutes: minutes, capSeconds: seconds };
    }
    case "amrap": {
      const { minutes, seconds } = splitSeconds(workout.durationSeconds);
      return { ...state, durationMinutes: minutes, durationSeconds: seconds };
    }
    case "emom": {
      const { minutes, seconds } = splitSeconds(workout.intervalSeconds);
      return {
        ...state,
        intervalMinutes: minutes,
        intervalSeconds: seconds,
        rounds: workout.rounds,
        // The form always shows at least one (empty) exercise row.
        stations: workout.stations.length > 0 ? [...workout.stations] : [""],
      };
    }
  }
}

export type FormValidation =
  | { ok: true; workout: Workout; errors: FieldErrors }
  | { ok: false; errors: FieldErrors };

/** Same schema as the server and the phone, mapped to form fields and message codes. */
export function validateWorkoutForm(state: WorkoutFormState): FormValidation {
  const result = workoutSchema.safeParse(toWorkoutInput(state));
  if (result.success) return { ok: true, workout: result.data, errors: {} };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const [key, index] = issue.path;
    const mapped = mapIssue(String(key), issue.message, issue.code, index);
    if (mapped && !errors[mapped.field]) errors[mapped.field] = mapped.code;
  }
  return { ok: false, errors };
}

function mapIssue(
  key: string,
  message: string,
  code: string,
  index: unknown,
): { field: FormField; code: FormErrorCode } | null {
  switch (key) {
    case "capSeconds":
      return { field: "cap", code: "workRange" };
    case "durationSeconds":
      return { field: "duration", code: "workRange" };
    case "intervalSeconds":
      return {
        field: "interval",
        code: code === "not_multiple_of" ? "intervalStep" : "intervalRange",
      };
    case "rounds":
      return {
        field: "rounds",
        code: message === "total_too_long" ? "totalTooLong" : "roundsRange",
      };
    case "stations":
      // `stations.3` is one exercise that is too long; `stations` is the list itself.
      return {
        field: "stations",
        code: index === undefined ? "tooManyStations" : "tooLong",
      };
    case "name":
    case "description":
      return { field: key, code: "tooLong" };
    case "prepSeconds":
      return { field: "prepSeconds", code: "invalid" };
    default:
      return null;
  }
}

/** Values the error messages interpolate, so the UI never hard-codes limits. */
export const FORM_LIMITS = {
  minWorkMinutes: LIMITS.minWorkSeconds / 60,
  maxWorkMinutes: LIMITS.maxWorkSeconds / 60,
  minIntervalSeconds: LIMITS.emom.minIntervalSeconds,
  maxIntervalMinutes: LIMITS.emom.maxIntervalSeconds / 60,
  intervalStepSeconds: LIMITS.emom.intervalStepSeconds,
  minRounds: LIMITS.emom.minRounds,
  maxRounds: LIMITS.emom.maxRounds,
  maxStations: LIMITS.emom.maxStations,
  nameMaxLength: LIMITS.nameMaxLength,
  descriptionMaxLength: LIMITS.descriptionMaxLength,
  stationMaxLength: LIMITS.emom.stationMaxLength,
} as const;
