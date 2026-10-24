"use client";

import { useMemo, useState } from "react";
import {
  INITIAL_FORM_STATE,
  validateWorkoutForm,
  type FormValidation,
  type WorkoutFormState,
} from "@/lib/coach/workout-form";
import type { Workout } from "@/lib/timer/schema";

export interface WorkoutFormEditor {
  form: WorkoutFormState;
  validation: FormValidation;
  /** The workout the phone preview shows: the current one, or the last valid one. */
  preview: Workout | null;
  update: (patch: Partial<WorkoutFormState>) => void;
  /** Replaces the whole form, e.g. when a preset is loaded. */
  replace: (state: WorkoutFormState) => void;
}

const lastValidOf = (state: WorkoutFormState): Workout | null => {
  const validation = validateWorkoutForm(state);
  return validation.ok ? validation.workout : null;
};

/** The coach form's state, shared by the builder and the preset lists. */
export function useWorkoutForm(): WorkoutFormEditor {
  const [form, setForm] = useState<WorkoutFormState>(INITIAL_FORM_STATE);
  // Keep showing the last valid workout (dimmed) while a field is being corrected.
  const [lastValid, setLastValid] = useState<Workout | null>(() =>
    lastValidOf(INITIAL_FORM_STATE),
  );
  const validation = useMemo(() => validateWorkoutForm(form), [form]);

  const replace = (next: WorkoutFormState) => {
    const valid = lastValidOf(next);
    if (valid) setLastValid(valid);
    setForm(next);
  };

  return {
    form,
    validation,
    preview: validation.ok ? validation.workout : lastValid,
    update: (patch) => replace({ ...form, ...patch }),
    replace,
  };
}
