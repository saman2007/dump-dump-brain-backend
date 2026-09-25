import * as p from "drizzle-orm/pg-core";

import { usersTable } from "./users.js";
import { timestamps } from "../columnHelpers.js";
import type { UserFeeling } from "../../types/schemas/profileInfo.js";

export const profileInfoTable = p.snakeCase.table("profileInfo", {
  id: p.uuid().primaryKey().defaultRandom(),
  userId: p
    .uuid()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  displayName: p.varchar({ length: 100 }),
  avatar: p.text(),
  feeling: p.jsonb().$type<UserFeeling>(),
  banner: p.text(),
  bio: p.text(),
  socialMedias: p.jsonb().$type<Record<string, string>>(),
  ...timestamps,
});

export type ProfileInfoSelect = typeof profileInfoTable.$inferSelect;
export type ProfileInfoInsert = typeof profileInfoTable.$inferInsert;
