import type {
  UsersInfoInsert,
  UsersInfoSelect,
} from "../../db/schemas/usersInfo.js";
import type { FullAuthUser } from "./users.js";

export interface UserFeeling {
  emoji: string;
  desc: string;
}

export type FullUserInfo = UsersInfoSelect & { username: string };

export type NormalUserInfo = Omit<
  FullUserInfo,
  "id" | "updatedAt" | "deletedAt"
>;

export interface UserInfoTypeMap {
  FULL_USER_INFO: FullUserInfo;
  NORMAL_USER_INFO: NormalUserInfo;
}

export type UserInfoTypes = keyof UserInfoTypeMap;

export interface FollowInfo {
  followersCount: number;
  followingCount: number;
}

export type PatchUserInfo = Partial<
  Omit<
    UsersInfoInsert,
    "userId" | "id" | "createdAt" | "updatedAt" | "deletedAt"
  >
>;

export type FollowItem = Pick<FullAuthUser, "id" | "username"> &
  Pick<FullUserInfo, "avatar" | "displayName"> & { createdAt: Date };
