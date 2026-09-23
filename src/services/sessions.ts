import * as d from "drizzle-orm";

import db from "../db/db.js";
import { sessionsTable, type RenderSession } from "../db/schemas/sessions.js";
import { getColumnsExcept } from "../utils/utils.js";

export class Session {
  public static getAll(userId: string): Promise<RenderSession[]> {
    return db
      .select(getColumnsExcept(sessionsTable, ["refreshToken"]))
      .from(sessionsTable)
      .where(d.eq(sessionsTable.id, userId));
  }

  public static async delete(
    sessionId: string,
    userId: string,
  ): Promise<RenderSession> {
    const [deletedSession] = await db
      .delete(sessionsTable)
      .where(
        d.and(
          d.eq(sessionsTable.id, sessionId),
          d.eq(sessionsTable.userId, userId),
        ),
      )
      .returning(getColumnsExcept(sessionsTable, ["refreshToken"]));

    return deletedSession;
  }
}
