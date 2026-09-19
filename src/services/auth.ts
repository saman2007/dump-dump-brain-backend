import * as d from "drizzle-orm";
import { hash, compare } from "bcrypt";

import db from "../db/db.js";
import {
  usersTable,
  type FullUser,
  type UserTypeMap,
  type UserTypes,
} from "../db/schemas/users.js";
import { getColumnsExcept, getColumnsIncludes } from "../utils/utils.js";
import type { SignupUserType } from "../controllers/auth.js";

export class User {
  private static readonly FIELD_EXCLUDES: Record<
    UserTypes,
    (keyof FullUser)[]
  > = {
    FULL_USER: [],
    AUTH_USER: ["password", "updatedAt", "deletedAt"],
    NO_TIMESTAMP_USER: ["createdAt", "updatedAt", "deletedAt"],
  } as const;

  public static async isEmailTaken(email: string): Promise<boolean> {
    const users = await db
      .select(getColumnsIncludes(usersTable, ["id"]))
      .from(usersTable)
      .where(d.eq(usersTable.email, email))
      .limit(1);

    return users.length !== 0;
  }

  public static async isUsernameTaken(username: string): Promise<boolean> {
    const users = await db
      .select(getColumnsIncludes(usersTable, ["id"]))
      .from(usersTable)
      .where(d.eq(usersTable.username, username))
      .limit(1);

    return users.length !== 0;
  }

  public static async register(userData: SignupUserType): Promise<string> {
    userData.password = await hash(userData.password, 10);

    const [{ id }] = await db
      .insert(usersTable)
      .values(userData)
      .returning({ id: usersTable.id });

    return id;
  }

  public static async getByUsername<T extends UserTypes = "AUTH_USER">(
    username: string,
    userType: T = "AUTH_USER" as T,
  ): Promise<UserTypeMap[T] | null> {
    const [user] = (await db
      .select(getColumnsExcept(usersTable, User.FIELD_EXCLUDES[userType]))
      .from(usersTable)
      .where(d.eq(usersTable.username, username))
      .limit(1)) as UserTypeMap[T][];

    return user;
  }

  public static async getById<T extends UserTypes = "AUTH_USER">(
    id: string,
    userType: T = "AUTH_USER" as T,
  ): Promise<UserTypeMap[T] | null> {
    const [user] = (await db
      .select(getColumnsExcept(usersTable, User.FIELD_EXCLUDES[userType]))
      .from(usersTable)
      .where(d.eq(usersTable.id, id))
      .limit(1)) as UserTypeMap[T][];

    return user;
  }

  public static async getByUsernameOrEmail<T extends UserTypes = "AUTH_USER">(
    usernameOrEmail: string,
    userType: T = "AUTH_USER" as T,
  ): Promise<UserTypeMap[T] | null> {
    const [user] = (await db
      .select(getColumnsExcept(usersTable, User.FIELD_EXCLUDES[userType]))
      .from(usersTable)
      .where(
        d.or(
          d.eq(usersTable.username, usernameOrEmail),
          d.eq(usersTable.email, usernameOrEmail),
        ),
      )
      .limit(1)) as UserTypeMap[T][];

    return user;
  }

  public static async checkPassword(
    userPassword: string,
    enteredPassword: string,
  ): Promise<boolean> {
    return await compare(enteredPassword, userPassword);
  }
}
