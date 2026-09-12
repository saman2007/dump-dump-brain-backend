import * as d from "drizzle-orm";

import db from "../db/db.js";
import { usersTable } from "../db/schemas/users.js";
import { getColumnsIncludes } from "../utils/utils.js";

export class User {
  async isEmailTaken(email: string): Promise<boolean> {
    const users: Pick<typeof usersTable.$inferSelect, "id">[] = await db
      .select(getColumnsIncludes(usersTable, ["id"]))
      .from(usersTable)
      .where(d.eq(usersTable.email, email))
      .limit(1);

    return users.length !== 0;
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const users: Pick<typeof usersTable.$inferSelect, "id">[] = await db
      .select(getColumnsIncludes(usersTable, ["id"]))
      .from(usersTable)
      .where(d.eq(usersTable.username, username))
      .limit(1);

    return users.length !== 0;
  }
}
