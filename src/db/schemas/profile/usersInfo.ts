import * as p from "drizzle-orm/pg-core";

import { usersTable } from "../auth/users.js";
import { timestamps } from "../../columnHelpers.js";
import type { UserFeeling } from "../../../types/schemas/usersInfo.js";
import profileSchema from "./index.js";

export const usersInfoTable = profileSchema.table("usersInfo", {
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

export type UsersInfoSelect = typeof usersInfoTable.$inferSelect;
export type UsersInfoInsert = typeof usersInfoTable.$inferInsert;
