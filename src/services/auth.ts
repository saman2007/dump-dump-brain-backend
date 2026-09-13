import * as d from "drizzle-orm";
import { hash } from "bcrypt";

import db from "../db/db.js";
import { usersTable } from "../db/schemas/users.js";
import { getColumnsExcept, getColumnsIncludes } from "../utils/utils.js";
import { type InsertUserInput } from "../utils/validations.js";

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

  public static async register(userData: InsertUserInput) {
    userData.password = await hash(userData.password, 10);

    await db.insert(usersTable).values(userData);
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
}
