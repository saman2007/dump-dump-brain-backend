import * as d from "drizzle-orm";
import { hash, compare } from "bcrypt";

import db from "../db/db.js";
import { usersTable, type NoTimestampUser } from "../db/schemas/users.js";
import { getColumnsExcept, getColumnsIncludes } from "../utils/utils.js";
import type { SignupUserType } from "../controllers/auth.js";

export class User {
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

  public static async getByUsername(username: string) {
    const [user] = await db
      .select(
        getColumnsExcept(usersTable, ["deletedAt", "updatedAt", "password"]),
      )
      .from(usersTable)
      .where(d.eq(usersTable.username, username))
      .limit(1);

    return user;
  }

  public static async getById(id: string) {
    const [user] = await db
      .select(
        getColumnsExcept(usersTable, ["deletedAt", "updatedAt", "password"]),
      )
      .from(usersTable)
      .where(d.eq(usersTable.id, id))
      .limit(1);

    return user;
  }

  public static async getByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<NoTimestampUser | null> {
    const [user] = await db
      .select(
        getColumnsExcept(usersTable, ["createdAt", "deletedAt", "updatedAt"]),
      )
      .from(usersTable)
      .where(
        d.or(
          d.eq(usersTable.username, usernameOrEmail),
          d.eq(usersTable.email, usernameOrEmail),
        ),
      );

    return user;
  }

  public static async checkUserPassword(
    userPassword: string,
    enteredPassword: string,
  ): Promise<boolean> {
    return await compare(enteredPassword, userPassword);
  }
}
