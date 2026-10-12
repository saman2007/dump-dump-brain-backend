import * as p from "drizzle-orm/pg-core";

import dumpsSchema from "./index.js";
import { commentsTable } from "./comments.js";
import { usersTable } from "../auth/users.js";
import { timestamps } from "../../columnHelpers.js";

export const commentLikesTable = dumpsSchema.table(
  "comment_likes",
  {
    id: p.uuid().primaryKey().defaultRandom(),
    commentId: p
      .uuid()
      .notNull()
      .references(() => commentsTable.id, { onDelete: "cascade" }),
    userId: p
      .uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    p.uniqueIndex("user_comment_like_unique_idx").on(t.userId, t.commentId),
    p.index("comment_likes_comment_idx").on(t.commentId),
  ],
);

export type CommentLikeSelect = typeof commentLikesTable.$inferSelect;
export type CommentLikeInsert = typeof commentLikesTable.$inferInsert;

