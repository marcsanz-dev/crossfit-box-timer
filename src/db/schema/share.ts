import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { Workout } from "@/lib/timer/schema";
import { user } from "./auth";

/**
 * A workout sent to a phone. It is a snapshot, so later edits to a preset never
 * change a timer that is already loaded, and it expires after a week.
 */
export const share = pgTable(
  "share",
  {
    code: text("code").primaryKey(),
    // Always re-validated with the Zod schema when read.
    workout: jsonb("workout").$type<Workout>().notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [index("share_created_by_idx").on(table.createdBy)],
);
