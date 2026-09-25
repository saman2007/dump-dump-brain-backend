import * as p from "drizzle-orm/pg-core";

import { timestamps } from "../columnHelpers.js";

export const userRoleEnum = p.pgEnum("user_role", ["user", "admin"]);

export const usersTable = p.snakeCase.table("users", {
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
