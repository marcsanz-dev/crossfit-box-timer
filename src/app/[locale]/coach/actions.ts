"use server";

import { headers } from "next/headers";
import { getAuth } from "@/auth/server";
import { createShare } from "@/db/shares";
import { workoutSchema } from "@/lib/timer/schema";

export type CreateShareResult =
  | { ok: true; code: string }
  | { ok: false; error: "session" | "invalid" | "server" };

/**
 * Sends a workout to the phone: stores a snapshot and returns its short code.
 * Server Actions are public endpoints, so the session and the workout are both
 * checked here, never trusted from the browser.
 */
export async function createShareAction(
  input: unknown,
): Promise<CreateShareResult> {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return { ok: false, error: "session" };

  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const code = await createShare(parsed.data, session.user.id);
    return { ok: true, code };
  } catch (error) {
    console.error("createShareAction failed", error);
    return { ok: false, error: "server" };
  }
}
