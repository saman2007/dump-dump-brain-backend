import * as p from "drizzle-orm/pg-core";

import { timestamps } from "../columnHelpers.js";

export const roleEnum = p.pgEnum("user_role", ["user", "admin"]);

export const usersTable = p.snakeCase.table("users", {
  id: p.uuid().defaultRandom().primaryKey(),
  email: p.varchar({ length: 255 }).unique().notNull(),
  username: p.varchar({ length: 100 }).unique().notNull(),
  displayName: p.varchar({ length: 100 }),
  avatar: p.text(),
  password: p.text().notNull(),
  role: roleEnum().default("user").notNull(),
  ...timestamps,
});