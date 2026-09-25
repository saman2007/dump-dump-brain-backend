import * as p from "drizzle-orm/pg-core";
import * as d from "drizzle-orm";

import { usersTable } from "./users.js";
import { timestamps } from "../columnHelpers.js";

export const followsTable = p.snakeCase.table(
  "follows",
  {
    id: p.uuid().primaryKey().defaultRandom(),
    //The user who is being followed
    followingId: p
      .uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    //The user who is following someone
    followerId: p
      .uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    p
      .uniqueIndex("unique_user_follow_idx")
      .on(table.followerId, table.followingId),
    p.index("user_following_idx").on(table.followingId),
    p.check(
      "prevent_self_follow_check",
      d.sql`${table.followerId} <> ${table.followingId}`,
    ),
  ],
);

export type FollowsSelect = typeof followsTable.$inferSelect;
export type FollowsInsert = typeof followsTable.$inferInsert;
