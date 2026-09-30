import * as p from "drizzle-orm/pg-core";

import { timestamps } from "../../columnHelpers.js";
import authSchema from "./index.js";

export const userRoleEnum = authSchema.enum("user_role", ["user", "admin"]);

export const usersTable = authSchema.table("users", {
  id: p.uuid().defaultRandom().primaryKey(),
  email: p.varchar({ length: 255 }).unique().notNull(),
  username: p.varchar({ length: 100 }).unique().notNull(),
  password: p.text().notNull(),
  role: userRoleEnum().default("user").notNull(),
  isAccountVerified: p.boolean().default(false).notNull(),
  isTwoFactorEnabled: p.boolean().default(false).notNull(),
  ...timestamps,
});

export type UserSelect = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;
