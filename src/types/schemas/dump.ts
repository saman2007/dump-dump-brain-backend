import type { InferEnum } from "drizzle-orm";

import type { reactionEnum } from "../../db/schemas/dump/reactions.js";
import type {
  DumpInsert,
  DumpSelect,
  dumpMoodEnum,
} from "../../db/schemas/dump/dumps.js";

export type ReactionType = InferEnum<typeof reactionEnum>;

export type DumpMoodType = InferEnum<typeof dumpMoodEnum>;

export type PostDumpData = Pick<DumpInsert, "author" | "content" | "mood">;

export type PatchDumpData = Partial<Pick<DumpInsert, "content" | "mood">>;

export interface FeedAuthor {
  id: string;
  username: string;
  avatar: string | null;
  displayName: string | null;
}

export type FeedDumpItem = Omit<
  DumpSelect,
  "views" | "updatedAt" | "author" | "hotScore"
> & {
  author: FeedAuthor;
};

export interface DumpsFeedCursor {
  hotScore?: number;
  trendingDumpId?: string;
  coldStartDumpId?: string;
  coldStartCreatedAt?: number;
  usersFollowingCreatedAt?: number;
  usersFollowingDumpId?: string;
}
