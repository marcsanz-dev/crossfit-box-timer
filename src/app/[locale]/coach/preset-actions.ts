"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/auth/server";
import {
  countPresets,
  createPreset,
  deletePreset,
  getPresetWorkout,
  updatePreset,
} from "@/db/presets";
import {
  MAX_PRESETS_PER_COACH,
  presetIdSchema,
  savePresetInputSchema,
} from "@/lib/coach/preset";

type PresetError =
  "session" | "invalid" | "noName" | "notFound" | "limit" | "server";

export type PresetResult =
  { ok: true; id: string } | { ok: false; error: PresetError };

// Server Actions are public endpoints: every action checks the session and
// validates its input, and changes only touch the signed-in coach's presets.

async function getCoachId(): Promise<string | null> {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.user.id ?? null;
}

async function underLimit(userId: string): Promise<boolean> {
  return (await countPresets(userId)) < MAX_PRESETS_PER_COACH;
}

/** Saves the workout as a new preset, or updates the coach's own preset `id`. */
export async function savePresetAction(input: unknown): Promise<PresetResult> {
  const userId = await getCoachId();
  if (!userId) return { ok: false, error: "session" };

  const parsed = savePresetInputSchema.safeParse(input);
  if (!parsed.success) {
    const noName = parsed.error.issues.some(
      (issue) => issue.message === "name_required",
    );
    return { ok: false, error: noName ? "noName" : "invalid" };
  }

  const { id, workout } = parsed.data;
  try {
    if (id) {
      if (!(await updatePreset(id, workout, userId))) {
        return { ok: false, error: "notFound" };
      }
      refresh();
      return { ok: true, id };
    }
    if (!(await underLimit(userId))) return { ok: false, error: "limit" };
    const newId = await createPreset(workout, userId);
    refresh();
    return { ok: true, id: newId };
  } catch (error) {
    console.error("savePresetAction failed", error);
    return { ok: false, error: "server" };
  }
}

/** Copies any coach's preset (usually from the Box library) into the coach's own. */
export async function duplicatePresetAction(
  input: unknown,
): Promise<PresetResult> {
  const userId = await getCoachId();
  if (!userId) return { ok: false, error: "session" };

  const id = presetIdSchema.safeParse(input);
  if (!id.success) return { ok: false, error: "invalid" };

  try {
    const workout = await getPresetWorkout(id.data);
    if (!workout) return { ok: false, error: "notFound" };
    if (!(await underLimit(userId))) return { ok: false, error: "limit" };
    const newId = await createPreset(workout, userId);
    refresh();
    return { ok: true, id: newId };
  } catch (error) {
    console.error("duplicatePresetAction failed", error);
    return { ok: false, error: "server" };
  }
}

/** Deletes one of the coach's own presets. */
export async function deletePresetAction(
  input: unknown,
): Promise<PresetResult> {
  const userId = await getCoachId();
  if (!userId) return { ok: false, error: "session" };

  const id = presetIdSchema.safeParse(input);
  if (!id.success) return { ok: false, error: "invalid" };

  try {
    if (!(await deletePreset(id.data, userId))) {
      return { ok: false, error: "notFound" };
    }
    refresh();
    return { ok: true, id: id.data };
  } catch (error) {
    console.error("deletePresetAction failed", error);
    return { ok: false, error: "server" };
  }
}
