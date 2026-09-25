import * as p from "drizzle-orm/pg-core";
import type { InferEnum } from "drizzle-orm";

import { timestamps } from "../columnHelpers.js";

export const userRoleEnum = p.pgEnum("user_role", ["user", "admin"]);
export type UserRole = InferEnum<typeof userRoleEnum>;

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

export type FullUser = typeof usersTable.$inferSelect;
export type AuthUser = Omit<
  FullUser,
  "createdAt" | "updatedAt" | "deletedAt" | "password"
>;
export type NoTimestampUser = Omit<
  FullUser,
  "createdAt" | "updatedAt" | "deletedAt"
>;
export interface UserTypeMap {
  FULL_USER: FullUser;
  AUTH_USER: AuthUser;
  NO_TIMESTAMP_USER: NoTimestampUser;
}
export type UserTypes = keyof UserTypeMap;
