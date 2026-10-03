import type { InferEnum } from "drizzle-orm";

import type { reactionEnum } from "../../db/schemas/dump/reactions.js";
import type { dumpMoodEnum } from "../../db/schemas/dump/dumps.js";

export type ReactionType = InferEnum<typeof reactionEnum>;

export type DumpMoodType = InferEnum<typeof dumpMoodEnum>;
