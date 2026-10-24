import { z } from "zod";
import { workoutSchema } from "@/lib/timer/schema";

/** Keeps one coach from filling the database; far above what a box needs. */
export const MAX_PRESETS_PER_COACH = 100;

export const presetIdSchema = z.string().trim().min(1).max(64);

/**
 * What the browser sends to save a preset: the workout, plus the id when it
 * updates one of the coach's own presets. A preset needs a name, so it can be
 * found again in the list.
 */
export const savePresetInputSchema = z.object({
  id: presetIdSchema.optional(),
  workout: workoutSchema.refine((workout) => workout.name !== undefined, {
    message: "name_required",
    path: ["name"],
  }),
});

export type SavePresetInput = z.input<typeof savePresetInputSchema>;
