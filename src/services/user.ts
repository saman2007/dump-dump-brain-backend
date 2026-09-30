import * as d from "drizzle-orm";

import db from "../db/db.js";
import {
  usersInfoTable,
  type UsersInfoInsert,
} from "../db/schemas/profile/usersInfo.js";
import type {
  FollowInfo,
  FollowItem,
  FullUserInfo,
  UserInfoTypeMap,
  UserInfoTypes,
} from "../types/schemas/usersInfo.js";
import { getColumnsExcept } from "../utils/utils.js";
import { usersTable } from "../db/schemas/auth/users.js";
import { followsTable } from "../db/schemas/profile/follows.js";

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
        followersCount: d.sql<number>`cast((SELECT count(*) FROM follows WHERE follows.following_id = users.id) as int)`,
        followingCount: d.sql<number>`cast((SELECT count(*) FROM follows WHERE follows.follower_id = users.id) as int)`,
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

export class User {
  public static follow(followerId: string, followingId: string) {
    return db.insert(followsTable).values({ followerId, followingId });
  }

  public static unfollow(followerId: string, followingId: string) {
    return db
      .delete(followsTable)
      .where(
        d.and(
          d.eq(followsTable.followerId, followerId),
          d.eq(followsTable.followingId, followingId),
        ),
      );
  }

  public static async getFollowersList(
    userId: string,
    cursor: Date | null,
    cursorId: string | null = null,
  ): Promise<FollowItem[]> {
    const truncatedCreatedAt = d.sql<Date>`date_trunc('milliseconds', ${followsTable.createdAt})`;

    const cursorCondition =
      cursor && cursorId
        ? d.or(
            d.lt(truncatedCreatedAt, cursor),
            d.and(
              d.eq(truncatedCreatedAt, cursor),
              d.lt(followsTable.id, cursorId),
            ),
          )
        : cursor
          ? d.lt(truncatedCreatedAt, cursor)
          : undefined;

    const followingUsers = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersInfoTable.displayName,
        avatar: usersInfoTable.avatar,
        createdAt: followsTable.createdAt,
        followId: followsTable.id,
      })
      .from(followsTable)
      .where(d.and(d.eq(followsTable.followingId, userId), cursorCondition))
      .innerJoin(usersTable, d.eq(followsTable.followerId, usersTable.id))
      .innerJoin(
        usersInfoTable,
        d.eq(followsTable.followerId, usersInfoTable.userId),
      )
      .limit(10)
      .orderBy(d.desc(followsTable.createdAt), d.desc(followsTable.id));

    return followingUsers;
  }

  public static async getFollowingList(
    userId: string,
    cursor: Date | null,
    cursorId: string | null = null,
  ): Promise<FollowItem[]> {
    const truncatedCreatedAt = d.sql<Date>`date_trunc('milliseconds', ${followsTable.createdAt})`;

    const cursorCondition =
      cursor && cursorId
        ? d.or(
            d.lt(truncatedCreatedAt, cursor),
            d.and(
              d.eq(truncatedCreatedAt, cursor),
              d.lt(followsTable.id, cursorId),
            ),
          )
        : cursor
          ? d.lt(truncatedCreatedAt, cursor)
          : undefined;

    const followingUsers = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersInfoTable.displayName,
        avatar: usersInfoTable.avatar,
        createdAt: followsTable.createdAt,
        followId: followsTable.id,
      })
      .from(followsTable)
      .where(d.and(d.eq(followsTable.followerId, userId), cursorCondition))
      .innerJoin(usersTable, d.eq(followsTable.followingId, usersTable.id))
      .innerJoin(
        usersInfoTable,
        d.eq(followsTable.followingId, usersInfoTable.userId),
      )
      .limit(10)
      .orderBy(d.desc(followsTable.createdAt), d.desc(followsTable.id));

    return followingUsers;
  }
}
