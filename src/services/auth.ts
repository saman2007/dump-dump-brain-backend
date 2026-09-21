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
  ServiceError,
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

interface RefreshTokenPayload {
  sessionId: string;
  iat: number;
  exp: number;
}

interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export class Auth {
  private static ACCESS_TOKEN_EXPIRES_AT: number = 15 * 60; // 15 minutes in seconds
  private static SESSION_EXPIRES_AT: number = 24 * 60 * 60 * 30; // 1 month(30 days) in seconds
  private static JWT_SECRET: string = process.env.JWT_PRIVATE_KEY;

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

  public static generateRefreshToken(
    sessionId: string,
    expiresIn: number = Auth.SESSION_EXPIRES_AT,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        { sessionId },
        Auth.JWT_SECRET,
        {
          expiresIn,
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

  public static async createSession(
    userId: string,
    userRole: UserRole,
    userIp: string | undefined,
    userAgent: string | undefined,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const sessionId = crypto.randomUUID();
    const refreshToken = await Auth.generateRefreshToken(sessionId);
    const sessionExpiresDate = new Date(
      Date.now() + Auth.SESSION_EXPIRES_AT * 1000,
    );

    await db.insert(sessionsTable).values({
      id: sessionId,
      userId,
      refreshToken: hashSHA256(refreshToken),
      ipAddress: userIp,
      userAgent,
      expiresAt: sessionExpiresDate,
    });

    const accessToken = await Auth.generateAccessToken(
      userId,
      userRole,
      sessionId,
    );

    return { accessToken, refreshToken };
  }

  public static deleteSession(sessionId: string) {
    return db.delete(sessionsTable).where(d.eq(sessionsTable.id, sessionId));
  }

  public static async refreshAccessToken(refreshToken: string): Promise<{
    newRefreshToken: string;
    newAccessToken: string;
    newRefreshTokenExpiresAt: number;
  }> {
    let payload: RefreshTokenPayload;

    try {
      payload = Auth.verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err instanceof ServiceError && err.code === 0) {
        const { sessionId } = jwt.decode(refreshToken) as RefreshTokenPayload;

        await Auth.deleteSession(sessionId);

        throw err;
      }

      throw err;
    }

    const { sessionId } = payload;

    const sessions = await db
      .select({
        ...getColumnsIncludes(sessionsTable, [
          "id",
          "expiresAt",
          "refreshToken",
        ]),
        user: { id: usersTable.id, role: usersTable.role },
      })
      .from(sessionsTable)
      .where(d.eq(sessionsTable.id, sessionId))
      .innerJoin(usersTable, d.eq(sessionsTable.userId, usersTable.id))
      .limit(1);

    if (sessions.length === 0) {
      throw new ServiceError(null, 4);
    }

    const [{ expiresAt, user, refreshToken: storedHashRefreshToken }] =
      sessions;

    if (storedHashRefreshToken !== hashSHA256(refreshToken)) {
      throw new ServiceError(null, 5);
    }

    const newRefreshTokenExpiresAt = Math.floor(
      (expiresAt.valueOf() - Date.now()) / 1000,
    );

    const newRefreshToken = await Auth.generateRefreshToken(
      sessionId,
      newRefreshTokenExpiresAt,
    );

    await db
      .update(sessionsTable)
      .set({ refreshToken: hashSHA256(newRefreshToken) })
      .where(d.eq(sessionsTable.id, sessionId));

    return {
      newRefreshToken,
      newAccessToken: await Auth.generateAccessToken(
        user.id,
        user.role,
        sessionId,
      ),
      newRefreshTokenExpiresAt,
    };
  }

  public static get getAccessTokenExpiresAt() {
    return Auth.ACCESS_TOKEN_EXPIRES_AT;
  }

  public static get getSessionExpiresAt() {
    return Auth.SESSION_EXPIRES_AT;
  }

  public static verifyRefreshToken(refreshToken: string): RefreshTokenPayload {
    try {
      const payload = jwt.verify(
        refreshToken,
        Auth.JWT_SECRET,
      ) as RefreshTokenPayload;

      return payload;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "TokenExpiredError") {
          throw new ServiceError(err.message, 0);
        } else if (err.name === "JsonWebTokenError") {
          throw new ServiceError(err.message, 1);
        } else if (err.name === "NotBeforeError") {
          throw new ServiceError(err.message, 2);
        } else {
          throw new ServiceError(err.message, 3);
        }
      }

      throw err;
    }
  }

  public static verifyAccessToken(accessToken: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(
        accessToken,
        Auth.JWT_SECRET,
      ) as AccessTokenPayload;

      return payload;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "TokenExpiredError") {
          throw new ServiceError(null, 0);
        } else if (err.name === "JsonWebTokenError") {
          throw new ServiceError(null, 1);
        } else if (err.name === "NotBeforeError") {
          throw new ServiceError(null, 2);
        } else {
          throw new ServiceError(err, 3);
        }
      }

      throw new ServiceError(err, 3);
    }
  }
}
