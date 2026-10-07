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

export const dumpPatchParamsSchema = z.object({
  dumpId: z.string().min(1),
});
export type DumpPatchParamsType = z.infer<typeof dumpPatchParamsSchema>;

export const dumpPatchBodySchema = z.object({
  content: z.string().min(1).max(3000).optional(),
  mood: z.enum(DUMP_MOOD).optional(),
});
export type DumpPatchBodyType = z.infer<typeof dumpPatchBodySchema>;

export const dumpPatchController: Controller<null> = async (req, res) => {
  const { userId } = req.accessTokenPayload!;
  const { dumpId } = req.params as DumpPatchParamsType;
  const patchData = req.body as DumpPatchBodyType;

  if (patchData.content === undefined && patchData.mood === undefined) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "At least one of 'content' or 'mood' must be provided.",
    });
  }

  const isUpdated = await Dump.patch(dumpId, userId, patchData);

  if (!isUpdated) {
    return res.status(404).json({
      success: false,
      data: null,
      message: "Dump not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: null,
    message: "Dump updated successfully.",
  });
};
