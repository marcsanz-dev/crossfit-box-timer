import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { Workout } from "@/lib/timer/schema";
import { user } from "./auth";

/**
 * A coach's saved workout. Every coach can read all presets (the Box library)
 * but only change their own; the name lives inside the workout.
 */
export const preset = pgTable(
  "preset",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Always re-validated with the Zod schema when read.
    workout: jsonb("workout").$type<Workout>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("preset_owner_id_idx").on(table.ownerId)],
);
