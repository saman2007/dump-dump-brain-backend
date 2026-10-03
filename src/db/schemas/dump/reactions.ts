import * as p from "drizzle-orm/pg-core";

import dumpsSchema from "./index.js";
import { dumpsTable } from "./dumps.js";
import { usersTable } from "../auth/users.js";
import { timestamps } from "../../columnHelpers.js";

export const reactionEnum = dumpsSchema.enum("reaction", [
  "understand",
  "loved",
  "heart_break",
  "melting",
  "funny",
  "mind_blown",
]);

export const reactionsTable = dumpsSchema.table(
  "reactions",
  {
    id: p.uuid().primaryKey().defaultRandom(),
    dumpId: p
      .uuid()
      .notNull()
      .references(() => dumpsTable.id, { onDelete: "cascade" }),
    userId: p
      .uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    reaction: reactionEnum().notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    p.uniqueIndex("user_dump_reaction_unique_idx").on(t.userId, t.dumpId),
    p.index("reactions_dump_idx").on(t.dumpId),
  ],
);

export type ReactionSelect = typeof reactionsTable.$inferSelect;
export type ReactionInsert = typeof reactionsTable.$inferInsert;
