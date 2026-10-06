import * as p from "drizzle-orm/pg-core";

import dumpsSchema from "./index.js";
import { timestamps } from "../../columnHelpers.js";
import { usersTable } from "../auth/users.js";
import type { ReactionType } from "../../../types/schemas/dump.js";
import { DUMP_MOOD } from "../../../utils/constants.js";

export const dumpMoodEnum = dumpsSchema.enum("dump_mood", DUMP_MOOD);

export const dumpsTable = dumpsSchema.table(
  "dumps",
  {
    id: p.uuid().primaryKey().defaultRandom(),
    content: p.text().notNull(),
    author: p
      .uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    mood: dumpMoodEnum().notNull(),
    views: p.integer().notNull().default(0),
    hotScore: p.doublePrecision().notNull(),
    reactionsCount: p
      .jsonb()
      .$type<Record<ReactionType, number>>()
      .notNull()
      .default({
        funny: 0,
        heart_break: 0,
        loved: 0,
        melting: 0,
        mind_blown: 0,
        understand: 0,
      }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    p.index("dump_hot_score_idx").on(t.hotScore),
    p.index("dump_created_at_idx").on(t.createdAt),
    p.index("dump_author_idx").on(t.author),
  ],
);

export type DumpSelect = typeof dumpsTable.$inferSelect;
export type DumpInsert = typeof dumpsTable.$inferInsert;
