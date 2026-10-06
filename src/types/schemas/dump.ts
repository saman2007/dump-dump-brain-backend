import type { InferEnum } from "drizzle-orm";

import type { reactionEnum } from "../../db/schemas/dump/reactions.js";
import type { DumpInsert, dumpMoodEnum } from "../../db/schemas/dump/dumps.js";

export type ReactionType = InferEnum<typeof reactionEnum>;

export type DumpMoodType = InferEnum<typeof dumpMoodEnum>;

export type PostDumpData = Pick<DumpInsert, "author" | "content" | "mood">;
