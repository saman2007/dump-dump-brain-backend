import * as p from "drizzle-orm/pg-core";

import dumpsSchema from "./index.js";
import { dumpsTable } from "./dumps.js";
import { usersTable } from "../auth/users.js";

export const viewsTable = dumpsSchema.table(
  "views",
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
    viewedAt: p.timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    p.uniqueIndex("user_dump_view_unique_idx").on(t.userId, t.dumpId),
    p.index("user_views_date_idx").on(t.userId, t.viewedAt),
    p.index("views_dump_id_idx").on(t.dumpId),
  ],
);

export type ViewSelect = typeof viewsTable.$inferSelect;
export type ViewInsert = typeof viewsTable.$inferInsert;
