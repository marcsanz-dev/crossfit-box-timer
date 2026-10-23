/** Google Workspace domain whose accounts are coaches. */
export const COACH_DOMAIN = "yaqbot.com";

export interface AccessEnvironment {
  /** `VERCEL_ENV`: "production" | "preview" | "development" | undefined (not on Vercel). */
  vercelEnv: string | undefined;
  /** `NODE_ENV` of the running server. */
  nodeEnv: string | undefined;
  /** `AUTH_EXTRA_EMAILS`: comma-separated developer emails (never set in Production). */
  extraEmails: string | undefined;
}

export type AccessDecision =
  | { allowed: true; via: "workspace" | "extra-email" }
  | {
      allowed: false;
      reason: "not_google" | "email_not_verified" | "not_a_coach";
    };

/**
 * Who may configure workouts. Called on the server for every Google sign-in.
 *
 * - **Coaches:** verified Google accounts whose ID token carries
 *   `hd = yaqbot.com`. Google documents `hd` as the trusted proof that an
 *   account belongs to a Workspace domain. An email that merely ends in
 *   `@yaqbot.com` is not enough, because anyone can create a consumer Google
 *   account with a non-Gmail address.
 * - **Developer testing:** the `AUTH_EXTRA_EMAILS` allowlist only works outside
 *   production. It fails closed: Vercel Production, or an unknown host
 *   running a production build, ignores it even if it is set by mistake.
 */
export function decideCoachAccess(
  providerId: string | undefined,
  profile: Record<string, unknown> | undefined,
  env: AccessEnvironment,
): AccessDecision {
  if (providerId !== "google" || !profile) {
    return { allowed: false, reason: "not_google" };
  }

  const email =
    typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
  // Google sends a boolean; some userinfo responses use the string "true".
  const verified =
    profile.email_verified === true || profile.email_verified === "true";
  if (!email || !verified) {
    return { allowed: false, reason: "email_not_verified" };
  }

  const domain = typeof profile.hd === "string" ? profile.hd.toLowerCase() : "";
  if (domain === COACH_DOMAIN && email.endsWith(`@${COACH_DOMAIN}`)) {
    return { allowed: true, via: "workspace" };
  }

  if (
    allowsExtraEmails(env) &&
    parseEmailList(env.extraEmails).includes(email)
  ) {
    return { allowed: true, via: "extra-email" };
  }

  return { allowed: false, reason: "not_a_coach" };
}

/** Vercel Preview, `vercel dev`, or local `next dev`; never production. */
export function allowsExtraEmails(env: AccessEnvironment): boolean {
  if (env.vercelEnv === "production") return false;
  if (env.vercelEnv === "preview" || env.vercelEnv === "development") {
    return true;
  }
  return env.vercelEnv === undefined && env.nodeEnv === "development";
}

/** True when sign-in must be limited to the coach domain (no extra emails). */
export function isCoachDomainOnly(env: AccessEnvironment): boolean {
  return !allowsExtraEmails(env);
}

export function parseEmailList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes("@"));
}
