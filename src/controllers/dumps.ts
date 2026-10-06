import z from "zod";
import { Dump } from "../services/dumps.js";
import type { Controller } from "../types/api.js";
import { DUMP_MOOD } from "../utils/constants.js";

export const dumpPostSchema = z.object({
  content: z.string().min(1).max(3000),
  mood: z.enum(DUMP_MOOD),
});

export type DumpPostType = z.infer<typeof dumpPostSchema>;

export const dumpPostController: Controller<{ id: string }> = async (
  req,
  res,
) => {
  const { userId } = req.accessTokenPayload!;
  const createData = req.body as DumpPostType;

  const id = await Dump.post({ ...createData, author: userId });

  return res.status(201).json({
    success: true,
    data: { id },
    message: "Posted dump successfully.",
  });
};
