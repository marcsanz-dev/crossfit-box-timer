import { z } from "zod";
import type { AccessEnvironment } from "@/lib/auth/coach-access";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  /** Developer emails allowed outside production only (see coach-access.ts). */
  AUTH_EXTRA_EMAILS: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

export type ServerEnv = z.output<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Server secrets, validated on first use rather than at import time, so the
 * static pages build without them. A missing or invalid variable fails loudly
 * with its name, never with a confusing runtime error.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(
      `Invalid server environment variables: ${names.join(", ")}`,
    );
  }
  cached = result.data;
  return cached;
}

export function getAccessEnvironment(env: ServerEnv): AccessEnvironment {
  return {
    vercelEnv: env.VERCEL_ENV,
    nodeEnv: env.NODE_ENV,
    extraEmails: env.AUTH_EXTRA_EMAILS,
  };
}
