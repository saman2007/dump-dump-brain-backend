import * as d from "drizzle-orm";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";

import db from "../db/db.js";
import {
  usersTable,
  type FullUser,
  type UserRole,
  type UserTypeMap,
  type UserTypes,
} from "../db/schemas/users.js";
import {
  generateRandomString,
  getColumnsExcept,
  getColumnsIncludes,
  hashSHA256,
} from "../utils/utils.js";
import type { SignupUserType } from "../controllers/auth.js";
import { sessionsTable } from "../db/schemas/sessions.js";

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

export class Auth {
  // 15 minutes
  private static ACCESS_TOKEN_EXPIRES_AT: number = 15 * 1000 * 60;
  // 1 month(30 days)
  private static SESSION_EXPIRES_AT: number = 24 * 1000 * 60 * 60 * 30;

  public static generateAccessToken(
    userId: string,
    userRole: UserRole,
    sessionId: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      jwt.sign(
        { userId, sessionId, role: userRole },
        process.env.JWT_PRIVATE_KEY,
        {
          expiresIn: Auth.ACCESS_TOKEN_EXPIRES_AT,
        },
        (err, token) => {
          if (err) {
            return reject(err);
          }

          resolve(token!);
        },
      );
    });
  }

  public static generateRefreshToken(): Promise<string> {
    return generateRandomString(32);
  }

  public static async createSession(
    userId: string,
    userRole: UserRole,
    userIp: string | undefined,
    userAgent: string | undefined,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const refreshToken = await Auth.generateRefreshToken();
    const sessionExpiresDate = new Date(Date.now() + Auth.SESSION_EXPIRES_AT);

    const [{ sessionId }] = await db
      .insert(sessionsTable)
      .values({
        userId,
        refreshToken: hashSHA256(refreshToken),
        ipAddress: userIp,
        userAgent,
        expiresAt: sessionExpiresDate,
      })
      .returning({ sessionId: sessionsTable.id });

    const accessToken = await Auth.generateAccessToken(
      userId,
      userRole,
      sessionId,
    );

    return { accessToken, refreshToken };
  }

  public static get getAccessTokenExpiresAt() {
    return Auth.ACCESS_TOKEN_EXPIRES_AT;
  }

  public static get getSessionExpiresAt() {
    return Auth.SESSION_EXPIRES_AT;
  }
}
