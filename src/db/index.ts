import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { getServerEnv } from "@/env";
import * as schema from "./schema";

function createDb() {
  // WebSocket pool (not neon-http) because Better Auth needs transactions.
  const pool = new Pool({ connectionString: getServerEnv().DATABASE_URL });
  return drizzle({ client: pool, schema });
}

let db: ReturnType<typeof createDb> | null = null;

/** Lazily created, so importing this module never needs the database URL. */
export function getDb() {
  db ??= createDb();
  return db;
}

export { schema };
