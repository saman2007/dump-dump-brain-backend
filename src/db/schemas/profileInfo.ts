import * as p from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { timestamps } from "../columnHelpers.js";

export interface UserFeeling {
  emoji: string;
  desc: string;
}

export const profileInfoTable = p.snakeCase.table("profileInfo", {
  id: p.uuid().primaryKey().defaultRandom(),
  userId: p
    .uuid()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  displayName: p.varchar({ length: 100 }),
  followersCount: p.integer().default(0).notNull(),
  followingCount: p.integer().default(0).notNull(),
  avatar: p.text(),
  feeling: p.jsonb().$type<UserFeeling>(),
  banner: p.text(),
  bio: p.text(),
  socialMedias: p.jsonb().$type<Record<string, string>>(),
  ...timestamps,
});
