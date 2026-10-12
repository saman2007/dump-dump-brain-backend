import * as d from "drizzle-orm";

import db from "../db/db.js";
import { dumpsTable } from "../db/schemas/dump/dumps.js";
import { reactionsTable } from "../db/schemas/dump/reactions.js";
import { viewsTable } from "../db/schemas/dump/views.js";
import { commentsTable } from "../db/schemas/dump/comments.js";
import { commentLikesTable } from "../db/schemas/dump/commentLikes.js";
import type {
  CommentItem,
  DumpMoodType,
  DumpsFeedCursor,
  FeedDumpItem,
  PatchDumpData,
  PostCommentData,
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

  public static async sendComment(data: PostCommentData): Promise<{
    success: boolean;
    id?: string;
    notFound?: "dump" | "parent_comment";
    parentMismatch?: boolean;
  }> {
    return await db.transaction(async (tx) => {
      const [dump] = await tx
        .select({ id: dumpsTable.id })
        .from(dumpsTable)
        .where(d.eq(dumpsTable.id, data.dumpId))
        .limit(1);

      if (!dump) {
        return { success: false, notFound: "dump" };
      }

      if (data.replyingTo) {
        const [parentComment] = await tx
          .select({
            id: commentsTable.id,
            dumpId: commentsTable.dumpId,
          })
          .from(commentsTable)
          .where(d.eq(commentsTable.id, data.replyingTo))
          .limit(1);

        if (!parentComment) {
          return { success: false, notFound: "parent_comment" };
        }

        if (parentComment.dumpId !== data.dumpId) {
          return { success: false, parentMismatch: true };
        }

        await tx
          .update(commentsTable)
          .set({ replyCount: d.sql`${commentsTable.replyCount} + 1` })
          .where(d.eq(commentsTable.id, data.replyingTo));
      }

      const [{ id }] = await tx
        .insert(commentsTable)
        .values({
          content: data.content,
          dumpId: data.dumpId,
          userId: data.userId,
          replyingTo: data.replyingTo || null,
        })
        .returning({ id: commentsTable.id });

      await tx
        .update(dumpsTable)
        .set({ commentsCount: d.sql`${dumpsTable.commentsCount} + 1` })
        .where(d.eq(dumpsTable.id, data.dumpId));

      return { success: true, id };
    });
  }

  public static async getComments({
    dumpId,
    currentUserId,
    replyingTo,
    cursor,
    limit = 10,
  }: {
    dumpId: string;
    currentUserId: string;
    replyingTo?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    data?: CommentItem[];
    nextCursor?: string | null;
    notFound?: "dump" | "parent_comment";
    parentMismatch?: boolean;
    invalidCursor?: boolean;
  }> {
    const [dump] = await db
      .select({ id: dumpsTable.id })
      .from(dumpsTable)
      .where(d.eq(dumpsTable.id, dumpId))
      .limit(1);

    if (!dump) {
      return { success: false, notFound: "dump" };
    }

    if (replyingTo) {
      const [parentComment] = await db
        .select({ id: commentsTable.id, dumpId: commentsTable.dumpId })
        .from(commentsTable)
        .where(d.eq(commentsTable.id, replyingTo))
        .limit(1);

      if (!parentComment) {
        return { success: false, notFound: "parent_comment" };
      }

      if (parentComment.dumpId !== dumpId) {
        return { success: false, parentMismatch: true };
      }
    }

    let cursorDate: Date | null = null;
    let cursorId: string | null = null;

    if (cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf-8"),
        );

        if (
          typeof decoded.createdAt !== "number" ||
          typeof decoded.id !== "string"
        ) {
          return { success: false, invalidCursor: true };
        }

        cursorDate = new Date(decoded.createdAt);
        cursorId = decoded.id;
      } catch {
        return { success: false, invalidCursor: true };
      }
    }

    const cursorCondition =
      cursorDate && cursorId
        ? d.or(
            d.lt(commentsTable.createdAt, cursorDate),
            d.and(
              d.eq(commentsTable.createdAt, cursorDate),
              d.lt(commentsTable.id, cursorId),
            ),
          )
        : undefined;

    const whereConditions = [
      d.eq(commentsTable.dumpId, dumpId),
      replyingTo
        ? d.eq(commentsTable.replyingTo, replyingTo)
        : d.isNull(commentsTable.replyingTo),
      cursorCondition,
    ].filter((v) => v);

    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const results = await db
      .select({
        id: commentsTable.id,
        dumpId: commentsTable.dumpId,
        content: commentsTable.content,
        replyingTo: commentsTable.replyingTo,
        likes: commentsTable.likes,
        replyCount: commentsTable.replyCount,
        createdAt: commentsTable.createdAt,
        updatedAt: commentsTable.updatedAt,
        author: {
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersInfoTable.displayName,
          avatar: usersInfoTable.avatar,
        },
        likeId: commentLikesTable.id,
      })
      .from(commentsTable)
      .innerJoin(usersTable, d.eq(commentsTable.userId, usersTable.id))
      .innerJoin(
        usersInfoTable,
        d.eq(commentsTable.userId, usersInfoTable.userId),
      )
      .leftJoin(
        commentLikesTable,
        d.and(
          d.eq(commentLikesTable.commentId, commentsTable.id),
          d.eq(commentLikesTable.userId, currentUserId),
        ),
      )
      .where(d.and(...whereConditions))
      .orderBy(d.desc(commentsTable.createdAt), d.desc(commentsTable.id))
      .limit(safeLimit + 1);

    const hasMore = results.length > safeLimit;
    const items = hasMore ? results.slice(0, safeLimit) : results;
    const lastItem = items.at(-1);

    const mappedItems: CommentItem[] = items.map(({ likeId, ...comment }) => ({
      ...comment,
      isLiked: Boolean(likeId),
    }));

    const nextCursor =
      hasMore && lastItem
        ? Buffer.from(
            JSON.stringify({
              createdAt: lastItem.createdAt.getTime(),
              id: lastItem.id,
            }),
          ).toString("base64")
        : null;

    return {
      success: true,
      data: mappedItems,
      nextCursor,
    };
  }

  public static async deleteComment({
    dumpId,
    commentId,
    currentUserId,
  }: {
    dumpId: string;
    commentId: string;
    currentUserId: string;
  }): Promise<{
    success: boolean;
    notFound?: "comment" | "dump";
    dumpMismatch?: boolean;
    forbidden?: boolean;
  }> {
    return await db.transaction(async (tx) => {
      const [comment] = await tx
        .select({
          id: commentsTable.id,
          dumpId: commentsTable.dumpId,
          userId: commentsTable.userId,
          replyingTo: commentsTable.replyingTo,
        })
        .from(commentsTable)
        .where(d.eq(commentsTable.id, commentId))
        .limit(1);

      if (!comment) {
        return { success: false, notFound: "comment" };
      }

      if (comment.dumpId !== dumpId) {
        return { success: false, dumpMismatch: true };
      }

      const [dump] = await tx
        .select({
          id: dumpsTable.id,
          author: dumpsTable.author,
        })
        .from(dumpsTable)
        .where(d.eq(dumpsTable.id, dumpId))
        .limit(1);

      if (!dump) {
        return { success: false, notFound: "dump" };
      }

      if (comment.userId !== currentUserId && dump.author !== currentUserId) {
        return { success: false, forbidden: true };
      }

      const countResult = await tx.execute<{ count: number }>(d.sql`
        WITH RECURSIVE to_delete AS (
          SELECT id FROM "dumps"."comments" WHERE id = ${commentId}::uuid
          UNION ALL
          SELECT c.id FROM "dumps"."comments" c
          JOIN to_delete td ON c.replying_to = td.id
        )
        SELECT COUNT(*)::int AS count FROM to_delete
      `);
      const totalDeleted = Number(countResult.rows[0]?.count ?? 1);

      if (comment.replyingTo) {
        await tx
          .update(commentsTable)
          .set({
            replyCount: d.sql`GREATEST(0, ${commentsTable.replyCount} - 1)`,
          })
          .where(d.eq(commentsTable.id, comment.replyingTo));
      }

      await tx.delete(commentsTable).where(d.eq(commentsTable.id, commentId));

      await tx
        .update(dumpsTable)
        .set({
          commentsCount: d.sql`GREATEST(0, ${dumpsTable.commentsCount} - ${totalDeleted})`,
        })
        .where(d.eq(dumpsTable.id, dumpId));

      return { success: true };
    });
  }

  public static async getFeed(
    userId: string,
    cursor?: string,
    mood?: DumpMoodType,
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
          mood ? d.eq(dumpsTable.mood, mood) : undefined,
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
          mood ? d.eq(dumpsTable.mood, mood) : undefined,
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
            mood ? d.eq(dumpsTable.mood, mood) : undefined,
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
            mood ? d.eq(dumpsTable.mood, mood) : undefined,
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
