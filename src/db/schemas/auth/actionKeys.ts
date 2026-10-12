import * as p from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { timestamps } from "../../columnHelpers.js";
import { otpTypes } from "../../../utils/constants.js";
import authSchema from "./index.js";

export const actionTypes = [...otpTypes] as const;

export const actionTypeEnum = authSchema.enum("action_type", actionTypes);

export const actionKeysTable = authSchema.table("action_keys", {
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
