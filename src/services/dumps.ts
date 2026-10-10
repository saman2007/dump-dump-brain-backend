import * as d from "drizzle-orm";

import db from "../db/db.js";
import { dumpsTable } from "../db/schemas/dump/dumps.js";
import { reactionsTable } from "../db/schemas/dump/reactions.js";
import { viewsTable } from "../db/schemas/dump/views.js";
import type {
  DumpsFeedCursor,
  FeedDumpItem,
  PatchDumpData,
  PostDumpData,
  ReactionType,
} from "../types/schemas/dump.js";
import {
  getColumnsExcept,
  getColumnsIncludes,
  shuffleArray,
} from "../utils/utils.js";
import { usersTable } from "../db/schemas/auth/users.js";
import { usersInfoTable } from "../db/schemas/profile/usersInfo.js";
import { followsTable } from "../db/schemas/profile/follows.js";

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

  public static async view(
    dumpId: string,
    userId: string,
  ): Promise<{ success: boolean; notFound?: boolean }> {
    const [dump] = await db
      .select({ id: dumpsTable.id })
      .from(dumpsTable)
      .where(d.eq(dumpsTable.id, dumpId))
      .limit(1);

    if (!dump) {
      return { success: false, notFound: true };
    }

    const inserted = await db
      .insert(viewsTable)
      .values({ dumpId, userId, viewedAt: new Date() })
      .onConflictDoNothing()
      .returning({ id: viewsTable.id });

    if (inserted.length > 0) {
      await db
        .update(dumpsTable)
        .set({ views: d.sql`${dumpsTable.views} + 1` })
        .where(d.eq(dumpsTable.id, dumpId));
    } else {
      // Already viewed by this user: update viewedAt timestamp to reset 15-day deduplication window
      await db
        .update(viewsTable)
        .set({ viewedAt: new Date() })
        .where(
          d.and(
            d.eq(viewsTable.userId, userId),
            d.eq(viewsTable.dumpId, dumpId),
          ),
        );
    }

    return { success: true };
  }

  public static async getFeed(
    userId: string,
    cursor?: string,
  ): Promise<{ data: FeedDumpItem[]; cursor?: string }> {
    const TRENDING_DUMPS_NUMBER = 9;
    const COLD_START_DUMPS_NUMBER = 3;
    const USERS_FOLLOWING_DUMPS_NUMBER = 3;
    const TARGET_FEED_SIZE = 15;
    const COLD_START_MAX_VIEWS = 50;
    const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 48);
    const fifteenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 15);

    /**
     * Dumps that are viewed by the user within 15 days, shouldn't be in the user's feed.
     * But dumps that are viewed by the user more than 15 days ago, have the chance to be in the user's feed.
     */
    const viewedDumpIds: string[] = (
      await db
        .select({ id: viewsTable.dumpId })
        .from(viewsTable)
        .where(
          d.and(
            d.gt(viewsTable.viewedAt, fifteenDaysAgo),
            d.eq(viewsTable.userId, userId),
          ),
        )
    ).map(({ id }) => id);

    let excludeDumps: string[] = [...viewedDumpIds];

    let cursorObj: DumpsFeedCursor | null = null;

    try {
      if (cursor) {
        cursorObj = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
      }
    } catch {}

    const dumpSelectFields = {
      ...getColumnsExcept(dumpsTable, ["views", "updatedAt"]),
      author: {
        id: usersTable.id,
        username: usersTable.username,
        avatar: usersInfoTable.avatar,
        displayName: usersInfoTable.displayName,
      },
    };

    const trendingDumps = await db
      .select(dumpSelectFields)
      .from(dumpsTable)
      .innerJoin(usersTable, d.eq(dumpsTable.author, usersTable.id))
      .innerJoin(usersInfoTable, d.eq(dumpsTable.author, usersInfoTable.userId))
      .where(
        d.and(
          d.ne(dumpsTable.author, userId),
          excludeDumps.length > 0
            ? d.notInArray(dumpsTable.id, excludeDumps)
            : undefined,
          cursorObj?.hotScore && cursorObj?.trendingDumpId
            ? d.or(
                d.and(
                  d.eq(dumpsTable.hotScore, cursorObj.hotScore),
                  d.lt(dumpsTable.id, cursorObj.trendingDumpId),
                ),
                d.lt(dumpsTable.hotScore, cursorObj.hotScore),
              )
            : undefined,
        ),
      )
      .orderBy(d.desc(dumpsTable.hotScore), d.desc(dumpsTable.id))
      .limit(TRENDING_DUMPS_NUMBER);

    excludeDumps.push(...trendingDumps.map(({ id }) => id));

    const coldStartDumps = await db
      .select(dumpSelectFields)
      .from(dumpsTable)
      .innerJoin(usersTable, d.eq(dumpsTable.author, usersTable.id))
      .innerJoin(usersInfoTable, d.eq(dumpsTable.author, usersInfoTable.userId))
      .where(
        d.and(
          d.ne(dumpsTable.author, userId),
          d.lte(dumpsTable.views, COLD_START_MAX_VIEWS),
          excludeDumps.length > 0
            ? d.notInArray(dumpsTable.id, excludeDumps)
            : undefined,
          cursorObj?.coldStartCreatedAt && cursorObj?.coldStartDumpId
            ? d.or(
                d.and(
                  d.eq(
                    dumpsTable.createdAt,
                    new Date(cursorObj.coldStartCreatedAt),
                  ),
                  d.lt(dumpsTable.id, cursorObj.coldStartDumpId),
                ),
                d.lt(
                  dumpsTable.createdAt,
                  new Date(cursorObj.coldStartCreatedAt),
                ),
              )
            : undefined,
          d.gte(dumpsTable.createdAt, twoDaysAgo),
        ),
      )
      .orderBy(d.desc(dumpsTable.createdAt), d.desc(dumpsTable.id))
      .limit(COLD_START_DUMPS_NUMBER);

    excludeDumps.push(...coldStartDumps.map(({ id }) => id));

    const usersFollowingId: string[] = (
      await db
        .select(getColumnsIncludes(followsTable, ["followingId"]))
        .from(followsTable)
        .where(d.eq(followsTable.followerId, userId))
    ).map(({ followingId }) => followingId);

    let usersFollowingDumps: (FeedDumpItem & { hotScore: number })[] = [];

    if (usersFollowingId.length > 0) {
      usersFollowingDumps = await db
        .select(dumpSelectFields)
        .from(dumpsTable)
        .innerJoin(usersTable, d.eq(dumpsTable.author, usersTable.id))
        .innerJoin(
          usersInfoTable,
          d.eq(dumpsTable.author, usersInfoTable.userId),
        )
        .where(
          d.and(
            d.ne(dumpsTable.author, userId),
            excludeDumps.length > 0
              ? d.notInArray(dumpsTable.id, excludeDumps)
              : undefined,

            d.inArray(dumpsTable.author, usersFollowingId),
            cursorObj?.usersFollowingCreatedAt &&
              cursorObj?.usersFollowingDumpId
              ? d.or(
                  d.and(
                    d.eq(
                      dumpsTable.createdAt,
                      new Date(cursorObj.usersFollowingCreatedAt),
                    ),
                    d.lt(dumpsTable.id, cursorObj.usersFollowingDumpId),
                  ),
                  d.lt(
                    dumpsTable.createdAt,
                    new Date(cursorObj.usersFollowingCreatedAt),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(d.desc(dumpsTable.createdAt), d.desc(dumpsTable.id))
        .limit(USERS_FOLLOWING_DUMPS_NUMBER);
    }

    const feed = [...trendingDumps, ...coldStartDumps, ...usersFollowingDumps];

    if (feed.length < TARGET_FEED_SIZE) {
      const needed = TARGET_FEED_SIZE - feed.length;

      const alreadySelectedIds = feed.map(({ id }) => id);

      const fallbackDumps = await db
        .select(dumpSelectFields)
        .from(dumpsTable)
        .innerJoin(usersTable, d.eq(dumpsTable.author, usersTable.id))
        .innerJoin(
          usersInfoTable,
          d.eq(dumpsTable.author, usersInfoTable.userId),
        )
        .where(
          d.and(
            d.ne(dumpsTable.author, userId),
            alreadySelectedIds.length > 0
              ? d.notInArray(dumpsTable.id, alreadySelectedIds)
              : undefined,
          ),
        )
        .orderBy(d.sql`RANDOM()`, d.asc(dumpsTable.createdAt))
        .limit(needed);

      feed.push(...fallbackDumps);
    }

    const newCursorObj: DumpsFeedCursor = {};

    if (trendingDumps.length > 0) {
      newCursorObj.hotScore = trendingDumps.at(-1)!.hotScore;
      newCursorObj.trendingDumpId = trendingDumps.at(-1)!.id;
    }

    if (coldStartDumps.length > 0) {
      newCursorObj.coldStartDumpId = coldStartDumps.at(-1)!.id;
      newCursorObj.coldStartCreatedAt = coldStartDumps
        .at(-1)!
        .createdAt.valueOf();
    }

    if (usersFollowingDumps.length > 0) {
      newCursorObj.usersFollowingDumpId = usersFollowingDumps.at(-1)!.id;
      newCursorObj.usersFollowingCreatedAt = usersFollowingDumps
        .at(-1)!
        .createdAt.valueOf();
    }

    const returnObj: { data: FeedDumpItem[]; cursor?: string } = {
      data: shuffleArray(feed.map(({ hotScore: _, ...other }) => other)),
    };

    if (Object.keys(newCursorObj as object).length > 0) {
      returnObj.cursor = Buffer.from(
        JSON.stringify(newCursorObj),
        "utf-8",
      ).toString("base64");
    }

    return returnObj;
  }
}
