import * as p from "drizzle-orm/pg-core";
import type { InferEnum } from "drizzle-orm";

import { timestamps } from "../columnHelpers.js";

export const userRoleEnum = p.pgEnum("user_role", ["user", "admin"]);
export type UserRole = InferEnum<typeof userRoleEnum>;

export const usersTable = p.snakeCase.table("users", {
  id: p.uuid().defaultRandom().primaryKey(),
  email: p.varchar({ length: 255 }).unique().notNull(),
  username: p.varchar({ length: 100 }).unique().notNull(),
  displayName: p.varchar({ length: 100 }),
  avatar: p.text(),
  password: p.text().notNull(),
  role: userRoleEnum().default("user").notNull(),
  isAccountVerified: p.boolean().default(false),
  ...timestamps,
});
