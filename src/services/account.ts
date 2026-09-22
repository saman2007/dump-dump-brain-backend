import * as d from "drizzle-orm";

import db from "../db/db.js";
import { usersTable } from "../db/schemas/users.js";

export class Account {
  public static async verify(userId: string): Promise<void> {
    await db
      .update(usersTable)
      .set({ isAccountVerified: true })
      .where(d.eq(usersTable.id, userId));
  }
}
