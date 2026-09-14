import * as p from "drizzle-orm/pg-core";
import type { InferEnum } from "drizzle-orm";

import { usersTable } from "./users.js";
import { timestamps } from "../columnHelpers.js";

export const otpTypeEnum = p.pgEnum("otp_type", [
  "account_verification",
  "password_reset",
  "two_factor",
]);
export type OTPType = InferEnum<typeof otpTypeEnum>;

export const otpsTable = p.snakeCase.table("otps", {
  id: p.uuid().defaultRandom().primaryKey(),
  userId: p
    .uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  type: otpTypeEnum().notNull(),
  code: p.varchar({ length: 64 }).notNull(),
  expiresAt: p.timestamp({ withTimezone: true }).notNull(),
  attempts: p.smallint().default(0).notNull(),
  createdAt: timestamps.createdAt,
});
