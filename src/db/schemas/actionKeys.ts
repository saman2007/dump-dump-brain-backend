import * as p from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { timestamps } from "../columnHelpers.js";
import { otpTypes } from "../../utils/constants.js";

export const actionTypes = [...otpTypes] as const;

export const actionTypeEnum = p.pgEnum("action_type", actionTypes);

export const actionKeysTable = p.snakeCase.table("action_keys", {
  id: p.uuid().defaultRandom().primaryKey(),
  userId: p
    .uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  type: actionTypeEnum().notNull(),
  keyHash: p.varchar({ length: 64 }).notNull(),
  createdAt: timestamps.createdAt,
});

export type ActionKeysSelect = typeof actionKeysTable.$inferSelect;
export type ActionKeysInsert = typeof actionKeysTable.$inferInsert;
