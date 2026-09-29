import type { InferEnum } from "drizzle-orm";
import type { userRoleEnum, UserSelect } from "../../db/schemas/users.js";

export type FullAuthUser = UserSelect;

export type AuthUser = Omit<
  FullAuthUser,
  "createdAt" | "updatedAt" | "deletedAt" | "password"
>;

export type NoTimestampAuthUser = Omit<
  FullAuthUser,
  "createdAt" | "updatedAt" | "deletedAt"
>;

export interface AuthUserTypeMap {
  FULL_AUTH_USER: FullAuthUser;
  AUTH_USER: AuthUser;
  NO_TIMESTAMP_AUTH_USER: NoTimestampAuthUser;
}

export type AuthUserTypes = keyof AuthUserTypeMap;

export type UserRole = InferEnum<typeof userRoleEnum>;
