import * as d from "drizzle-orm";

import db from "../db/db.js";
import { dumpsTable } from "../db/schemas/dump/dumps.js";
import { reactionsTable } from "../db/schemas/dump/reactions.js";
import type {
  PatchDumpData,
  PostDumpData,
  ReactionType,
} from "../types/schemas/dump.js";

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

  public static async patch(
    dumpId: string,
    authorId: string,
    data: PatchDumpData,
  ): Promise<boolean> {
    const result = await db
      .update(dumpsTable)
      .set(data)
      .where(
        d.and(d.eq(dumpsTable.id, dumpId), d.eq(dumpsTable.author, authorId)),
      )
      .returning({ id: dumpsTable.id });

    return result.length > 0;
  }

  public static async react(
    dumpId: string,
    userId: string,
    reaction: ReactionType,
  ): Promise<{
    success: boolean;
    notFound?: boolean;
    action?: "added" | "updated" | "removed";
  }> {
    return await db.transaction(async (tx) => {
      const [dump] = await tx
        .select({
          id: dumpsTable.id,
          createdAt: dumpsTable.createdAt,
          reactionsCount: dumpsTable.reactionsCount,
        })
        .from(dumpsTable)
        .where(d.eq(dumpsTable.id, dumpId))
        .for("no key update")
        .limit(1);

      if (!dump) {
        return { success: false, notFound: true };
      }

      const [existingReaction] = await tx
        .select({
          id: reactionsTable.id,
          reaction: reactionsTable.reaction,
        })
        .from(reactionsTable)
        .where(
          d.and(
            d.eq(reactionsTable.dumpId, dumpId),
            d.eq(reactionsTable.userId, userId),
          ),
        )
        .limit(1);

      const updatedCounts = { ...dump.reactionsCount };
      let action: "added" | "updated" | "removed";

      if (existingReaction && existingReaction.reaction === reaction) {
        // Toggle OFF (remove reaction)
        await tx
          .delete(reactionsTable)
          .where(d.eq(reactionsTable.id, existingReaction.id));

        updatedCounts[reaction] = Math.max(0, updatedCounts[reaction] - 1);

        action = "removed";
      } else if (existingReaction) {
        // Switch to DIFFERENT reaction
        await tx
          .update(reactionsTable)
          .set({ reaction })
          .where(d.eq(reactionsTable.id, existingReaction.id));

        updatedCounts[existingReaction.reaction] = Math.max(
          0,
          updatedCounts[existingReaction.reaction] - 1,
        );

        updatedCounts[reaction] = updatedCounts[reaction] + 1;
        action = "updated";
      } else {
        // Add NEW reaction
        await tx.insert(reactionsTable).values({
          dumpId,
          userId,
          reaction,
        });

        updatedCounts[reaction] = updatedCounts[reaction] + 1;
        action = "added";
      }

      const totalReactions = Object.values(updatedCounts).reduce(
        (sum, count) => sum + count,
        0,
      );

      const newHotScore = Dump.calculateHotScore(
        totalReactions,
        new Date(dump.createdAt),
      );

      await tx
        .update(dumpsTable)
        .set({
          reactionsCount: updatedCounts,
          hotScore: newHotScore,
        })
        .where(d.eq(dumpsTable.id, dumpId));

      return { success: true, action };
    });
  }
}
