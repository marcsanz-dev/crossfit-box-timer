import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getDb, schema } from "@/db";
import { getAccessEnvironment, getServerEnv } from "@/env";
import {
  COACH_DOMAIN,
  decideCoachAccess,
  isCoachDomainOnly,
} from "@/lib/auth/coach-access";

export const AUTH_ERROR_PATH = "/coach/denied";

function createAuth() {
  const env = getServerEnv();
  const access = getAccessEnvironment(env);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    // Google is the only way in: no email/password, no other providers.
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
        // In production Better Auth also rejects tokens without hd=yaqbot.com,
        // and Google only offers @yaqbot.com accounts. A second, independent check.
        ...(isCoachDomainOnly(access) ? { hd: COACH_DOMAIN } : {}),
      },
    },
    user: {
      // Runs on the server for every Google sign-in, including returning users.
      validateUserInfo: ({ source }) => {
        const decision = decideCoachAccess(
          source.oauth?.providerId,
          source.oauth?.profile,
          access,
        );
        if (!decision.allowed) {
          return {
            error: decision.reason,
            errorDescription: "Only CrossFit Box coaches can sign in.",
          };
        }
      },
    },
    onAPIError: { errorURL: AUTH_ERROR_PATH },
    // Must stay last: lets Server Actions set auth cookies.
    plugins: [nextCookies()],
  });
}

let auth: ReturnType<typeof createAuth> | null = null;

/** Lazily created, so static pages build without auth secrets. */
export function getAuth() {
  auth ??= createAuth();
  return auth;
}
