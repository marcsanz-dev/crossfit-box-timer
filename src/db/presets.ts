import { and, count, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { workoutSchema, type Workout } from "@/lib/timer/schema";
import { getDb } from "./index";
import { preset, user } from "./schema";

export interface PresetSummary {
  id: string;
  workout: Workout;
  ownerName: string;
}

export interface PresetLists {
  mine: PresetSummary[];
  /** Other coaches' presets: read-only, but any coach can duplicate them. */
  library: PresetSummary[];
}

/** Every preset, split into the coach's own and the Box library. */
export async function listPresets(userId: string): Promise<PresetLists> {
  const rows = await getDb()
    .select({
      id: preset.id,
      ownerId: preset.ownerId,
      workout: preset.workout,
      ownerName: user.name,
    })
    .from(preset)
    .innerJoin(user, eq(preset.ownerId, user.id))
    .orderBy(desc(preset.updatedAt));

  const lists: PresetLists = { mine: [], library: [] };
  for (const row of rows) {
    const parsed = workoutSchema.safeParse(row.workout);
    // A row that no longer matches the schema is skipped, never shown broken.
    if (!parsed.success) continue;
    const summary = {
      id: row.id,
      workout: parsed.data,
      ownerName: row.ownerName,
    };
    (row.ownerId === userId ? lists.mine : lists.library).push(summary);
  }
  return lists;
}

export async function countPresets(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(preset)
    .where(eq(preset.ownerId, userId));
  return row?.total ?? 0;
}

export async function createPreset(
  workout: Workout,
  userId: string,
): Promise<string> {
  const id = nanoid();
  await getDb().insert(preset).values({ id, ownerId: userId, workout });
  return id;
}

/** Updates one of the coach's own presets; false when it isn't theirs or doesn't exist. */
export async function updatePreset(
  id: string,
  workout: Workout,
  userId: string,
): Promise<boolean> {
  const updated = await getDb()
    .update(preset)
    .set({ workout })
    .where(and(eq(preset.id, id), eq(preset.ownerId, userId)))
    .returning({ id: preset.id });
  return updated.length > 0;
}

/** Deletes one of the coach's own presets; false when it isn't theirs or doesn't exist. */
export async function deletePreset(
  id: string,
  userId: string,
): Promise<boolean> {
  const deleted = await getDb()
    .delete(preset)
    .where(and(eq(preset.id, id), eq(preset.ownerId, userId)))
    .returning({ id: preset.id });
  return deleted.length > 0;
}

/** Any coach's preset, validated; null when it doesn't exist or is corrupt. */
export async function getPresetWorkout(id: string): Promise<Workout | null> {
  const [row] = await getDb()
    .select({ workout: preset.workout })
    .from(preset)
    .where(eq(preset.id, id))
    .limit(1);
  if (!row) return null;
  const parsed = workoutSchema.safeParse(row.workout);
  return parsed.success ? parsed.data : null;
}
