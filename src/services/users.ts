import * as d from "drizzle-orm";

import db from "../db/db.js";
import {
  usersInfoTable,
  type UsersInfoInsert,
  type UsersInfoSelect,
} from "../db/schemas/usersInfo.js";
import type {
  FollowInfo,
  FullUserInfo,
  UserInfoTypeMap,
  UserInfoTypes,
} from "../types/schemas/usersInfo.js";
import { getColumnsExcept } from "../utils/utils.js";
import { usersTable } from "../db/schemas/users.js";
import { followsTable } from "../db/schemas/follows.js";

export class UserInfo {
  private static readonly FIELD_EXCLUDES: Record<
    UserInfoTypes,
    (keyof Omit<FullUserInfo, "username">)[]
  > = {
    FULL_USER_INFO: [],
    NORMAL_USER_INFO: ["id", "updatedAt", "deletedAt"],
  } as const;

  public static async get<T extends UserInfoTypes = "NORMAL_USER_INFO">(
    username: string,
    userInfoType: T = "NORMAL_USER_INFO" as T,
  ): Promise<UserInfoTypeMap[T] | undefined> {
    const [userInfo] = (await db
      .select({
        username: usersTable.username,
        ...getColumnsExcept(
          usersInfoTable,
          UserInfo.FIELD_EXCLUDES[userInfoType],
        ),
      })
      .from(usersInfoTable)
      .innerJoin(usersTable, d.eq(usersInfoTable.userId, usersTable.id))
      .where(d.eq(usersTable.username, username))
      .limit(1)) as UserInfoTypeMap[T][];

    return userInfo;
  }

  public static async getFollowCount(
    username: string,
  ): Promise<FollowInfo | undefined> {
    const [result] = await db
      .select({
        followersCount: d.sql<number>`cast((SELECT count(*) FROM follows WHERE ${followsTable.followingId} = ${usersTable.id}) as int)`,
        followingCount: d.sql<number>`cast((SELECT count(*) FROM follows WHERE ${followsTable.followerId} = ${usersTable.id}) as int)`,
      })
      .from(usersTable)
      .where(d.eq(usersTable.username, username))
      .limit(1);

    return result ?? undefined;
  }

  public static async update(
    userId: string,
    patchData: Partial<
      Omit<
        UsersInfoInsert,
        "userId" | "id" | "createdAt" | "updatedAt" | "deletedAt"
      >
    >,
  ): Promise<boolean> {
    if (Object.keys(patchData).length === 0) {
      return true;
    }

    const res = await db
      .update(usersInfoTable)
      .set(patchData)
      .where(d.eq(usersInfoTable.userId, userId));

    return (res.rowCount ?? 0) > 0;
  }
}

