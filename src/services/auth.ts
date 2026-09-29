import * as d from "drizzle-orm";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";

import db from "../db/db.js";
import { usersTable } from "../db/schemas/users.js";
import type {
  FullAuthUser,
  UserRole,
  AuthUserTypeMap,
  AuthUserTypes,
} from "../types/schemas/users.js";
import {
  getColumnsExcept,
  getColumnsIncludes,
  hashSHA256,
  ServiceError,
} from "../utils/utils.js";
import type { SignupUserType } from "../controllers/auth.js";
import { sessionsTable } from "../db/schemas/sessions.js";
import { usersInfoTable } from "../db/schemas/usersInfo.js";

export class AuthUser {
  private static readonly FIELD_EXCLUDES: Record<
    AuthUserTypes,
    (keyof FullAuthUser)[]
  > = {
    FULL_AUTH_USER: [],
    AUTH_USER: ["password", "updatedAt", "deletedAt"],
    NO_TIMESTAMP_AUTH_USER: ["createdAt", "updatedAt", "deletedAt"],
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

    const { displayName, ...authData } = userData;

    const [{ id }] = await db
      .insert(usersTable)
      .values(authData)
      .returning({ id: usersTable.id });

    await db.insert(usersInfoTable).values({ userId: id, displayName });

    return id;
  }

  public static async getByUsername<T extends AuthUserTypes = "AUTH_USER">(
    username: string,
    userType: T = "AUTH_USER" as T,
  ): Promise<AuthUserTypeMap[T] | undefined> {
    const [user] = (await db
      .select(getColumnsExcept(usersTable, AuthUser.FIELD_EXCLUDES[userType]))
      .from(usersTable)
      .where(d.eq(usersTable.username, username))
      .limit(1)) as AuthUserTypeMap[T][];

    return user;
  }

  public static async getById<T extends AuthUserTypes = "AUTH_USER">(
    id: string,
    userType: T = "AUTH_USER" as T,
  ): Promise<AuthUserTypeMap[T] | undefined> {
    const [user] = (await db
      .select(getColumnsExcept(usersTable, AuthUser.FIELD_EXCLUDES[userType]))
      .from(usersTable)
      .where(d.eq(usersTable.id, id))
      .limit(1)) as AuthUserTypeMap[T][];

    return user;
  }

  public static async getByUsernameOrEmail<
    T extends AuthUserTypes = "AUTH_USER",
  >(
    usernameOrEmail: string,
    userType: T = "AUTH_USER" as T,
  ): Promise<AuthUserTypeMap[T] | undefined> {
    const [user] = (await db
      .select(getColumnsExcept(usersTable, AuthUser.FIELD_EXCLUDES[userType]))
      .from(usersTable)
      .where(
        d.or(
          d.eq(usersTable.username, usernameOrEmail),
          d.eq(usersTable.email, usernameOrEmail),
        ),
      )
      .limit(1)) as AuthUserTypeMap[T][];

    return user;
  }

  public static async checkPassword(
    userPassword: string,
    enteredPassword: string,
  ): Promise<boolean> {
    return await compare(enteredPassword, userPassword);
  }
}

export interface RefreshTokenPayload {
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AccessTokenPayload {
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
    return new Promise((resolve, reject) => {
      jwt.sign(
        { userId, sessionId, role: userRole },
        Auth.JWT_SECRET,
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
      /**
       * When an error happens, it definitely means that the token has been expired or someone is trying to get an access token illegally.
       * I decided to delete the session in this case, for security purposes, if possible. Because there could be a `sessionId` in the refresh token.
       * And the sessionId could be real, so in this case I try to delete the session to make things harder for the attacker.
       */
      const { sessionId } = jwt.decode(refreshToken) as RefreshTokenPayload;

      if (sessionId) {
        try {
          await Auth.deleteSession(sessionId);
        } catch {}
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

    // When no session exist with the refresh token's sessionId, it means that the session has been terminated.
    if (sessions.length === 0) {
      throw new ServiceError(null, 3);
    }

    const [{ expiresAt, user, refreshToken: storedHashRefreshToken }] =
      sessions;

    /**
     * When a valid refresh token is sent, but it doesn't match the refresh token stored in the session,
     * it could mean that someone has access to the user's refresh token.
     * Because we rotate the refresh token after refreshing the access token.
     */
    if (storedHashRefreshToken !== hashSHA256(refreshToken)) {
      await Auth.deleteSession(sessionId);

      throw new ServiceError(null, 4);
    }

    // Making the new refresh token's expiration time the same as the original expiration time
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
          throw err;
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
