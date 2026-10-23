import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read Next.js env files, so load one explicitly:
// .env.local (Neon "dev" branch) by default, or DB_ENV_FILE=.env.migrate.production
// to migrate the Neon "production" branch. Missing files are fine (CI sets env directly).
try {
  process.loadEnvFile(process.env.DB_ENV_FILE ?? ".env.local");
} catch {
  // No env file: rely on variables already in the environment.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
