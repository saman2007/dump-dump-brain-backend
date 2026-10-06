import db from "../db/db.js";
import { dumpsTable } from "../db/schemas/dump/dumps.js";
import type { PostDumpData } from "../types/schemas/dump.js";

export class Dump {
  private static HOT_SCORE_BASE_EPOCH = Math.floor(
    new Date(2026, 0, 1).valueOf() / 1000,
  );

  private static calculateHotScore(
    reactionsCount: number,
    createdAt: Date,
  ): number {
    return (
      Math.log10(Math.max(reactionsCount, 1)) +
      (Math.floor(createdAt.valueOf() / 1000) - Dump.HOT_SCORE_BASE_EPOCH) /
        45000
    );
  }

  public static async post(data: PostDumpData): Promise<string> {
    const [{ id }] = await db
      .insert(dumpsTable)
      .values({ ...data, hotScore: Dump.calculateHotScore(0, new Date()) })
      .returning({ id: dumpsTable.id });

    return id;
  }
}
