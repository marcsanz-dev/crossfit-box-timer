import { and, eq, gt } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { CODE_ALPHABET, CODE_LENGTH, SHARE_TTL_MS } from "@/lib/share/code";
import { workoutSchema, type Workout } from "@/lib/timer/schema";
import { getDb } from "./index";
import { share } from "./schema";

const newCode = customAlphabet(CODE_ALPHABET, CODE_LENGTH);
const MAX_ATTEMPTS = 5;

/** Stores a snapshot of the workout and returns its short code. */
export async function createShare(
  workout: Workout,
  userId: string,
): Promise<string> {
  const db = getDb();
  // A collision is astronomically unlikely, but the primary key makes it safe:
  // on conflict nothing is written and a new code is tried.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = newCode();
    const inserted = await db
      .insert(share)
      .values({
        code,
        workout,
        createdBy: userId,
        expiresAt: new Date(Date.now() + SHARE_TTL_MS),
      })
      .onConflictDoNothing()
      .returning({ code: share.code });
    if (inserted.length > 0) return code;
  }
  throw new Error("Could not allocate a unique share code");
}

/** The shared workout, or null when the code is unknown, expired or corrupt. */
export async function getSharedWorkout(code: string): Promise<Workout | null> {
  const [row] = await getDb()
    .select({ workout: share.workout })
    .from(share)
    .where(and(eq(share.code, code), gt(share.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  const parsed = workoutSchema.safeParse(row.workout);
  return parsed.success ? parsed.data : null;
}
