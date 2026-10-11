import * as p from "drizzle-orm/pg-core";

import dumpsSchema from "./index.js";
import { usersTable } from "../auth/users.js";
import { timestamps } from "../../columnHelpers.js";
import { dumpsTable } from "./dumps.js";

export const commentsTable = dumpsSchema.table(
  "comments",
  {
    id: p.uuid().defaultRandom().primaryKey(),
    content: p.text().notNull(),
    dumpId: p
      .uuid()
      .notNull()
      .references(() => dumpsTable.id, { onDelete: "cascade" }),
    userId: p
      .uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    replyingTo: p.uuid().references((): p.AnyPgColumn => commentsTable.id, {
      onDelete: "cascade",
    }),
    likes: p.integer().default(0).notNull(),
    replyCount: p.integer().default(0).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    p.index("replying_to_idx").on(t.replyingTo),
    p.index("comments_dump_created_at_idx").on(t.dumpId, t.createdAt),
  ],
);

export type CommentSelect = typeof commentsTable.$inferSelect;
export type CommentInsert = typeof commentsTable.$inferInsert;
