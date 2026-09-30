import * as p from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { timestamps } from "../../columnHelpers.js";
import authSchema from "./index.js";

export const sessionsTable = authSchema.table("sessions", {
  id: p.uuid().defaultRandom().primaryKey(),
  userId: p
    .uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  refreshToken: p.varchar({ length: 64 }).notNull(),
  userAgent: p.text(),
  ipAddress: p.varchar({ length: 45 }),
  expiresAt: p.timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamps.createdAt,
});

export type SessionsSelect = typeof sessionsTable.$inferSelect;
export type SessionsInsert = typeof sessionsTable.$inferInsert;
