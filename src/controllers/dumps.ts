import z from "zod";
import { Dump } from "../services/dumps.js";
import type { Controller } from "../types/api.js";
import type { CommentItem, FeedDumpItem } from "../types/schemas/dump.js";
import { DUMP_MOOD, DUMP_REACTION } from "../utils/constants.js";

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

export const dumpReactionParamsSchema = z.object({
  dumpId: z.string().min(1),
});
export type DumpReactionParamsType = z.infer<typeof dumpReactionParamsSchema>;

export const dumpReactionBodySchema = z.object({
  reaction: z.enum(DUMP_REACTION),
});
export type DumpReactionBodyType = z.infer<typeof dumpReactionBodySchema>;

export const dumpReactionPostController: Controller<null> = async (
  req,
  res,
) => {
  const { userId } = req.accessTokenPayload!;
  const { dumpId } = req.params as DumpReactionParamsType;
  const { reaction } = req.body as DumpReactionBodyType;

  const result = await Dump.react(dumpId, userId, reaction);

  if (result.notFound) {
    return res.status(404).json({
      success: false,
      data: null,
      message: "Dump not found.",
    });
  }

  const messageMap = {
    added: "Reaction added successfully.",
    updated: "Reaction updated successfully.",
    removed: "Reaction removed successfully.",
  };

  return res.status(200).json({
    success: true,
    data: null,
    message: messageMap[result.action!],
  });
};

export const dumpViewParamsSchema = z.object({
  dumpId: z.string().min(1),
});
export type DumpViewParamsType = z.infer<typeof dumpViewParamsSchema>;

export const dumpViewPostController: Controller<null> = async (req, res) => {
  const { userId } = req.accessTokenPayload!;
  const { dumpId } = req.params as DumpViewParamsType;

  const result = await Dump.view(dumpId, userId);

  if (result.notFound) {
    return res.status(404).json({
      success: false,
      data: null,
      message: "Dump not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: null,
    message: "View recorded successfully.",
  });
};

export const dumpFeedQuerySchema = z.object({
  cursor: z.string().optional(),
});
export type DumpFeedQueryType = z.infer<typeof dumpFeedQuerySchema>;

export const dumpFeedGetController: Controller<{
  items: FeedDumpItem[];
  nextCursor?: string;
}> = async (req, res) => {
  const { userId } = req.accessTokenPayload!;
  const { cursor } = req.query as DumpFeedQueryType;

  const result = await Dump.getFeed(userId, cursor);

  return res.status(200).json({
    success: true,
    data: {
      items: result.data,
      nextCursor: result.cursor,
    },
    message: null,
  });
};

export const dumpCommentParamsSchema = z.object({
  dumpId: z.string(),
});
export type DumpCommentParamsType = z.infer<typeof dumpCommentParamsSchema>;

export const dumpCommentBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty.")
    .max(1000, "Comment cannot exceed 1000 characters."),
  replyingTo: z
    .string()
    .optional()
    .meta({ description: "The id of the comment that user is replying to." }),
});
export type DumpCommentBodyType = z.infer<typeof dumpCommentBodySchema>;

export const dumpCommentPostController: Controller<{ id: string }> = async (
  req,
  res,
) => {
  const { userId } = req.accessTokenPayload!;
  const { dumpId } = req.params as DumpCommentParamsType;
  const { content, replyingTo } = req.body as DumpCommentBodyType;

  const result = await Dump.sendComment({
    dumpId,
    userId,
    content,
    replyingTo,
  });

  if (!result.success) {
    if (result.notFound === "dump") {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Dump not found.",
      });
    }

    if (result.notFound === "parent_comment") {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Parent comment not found.",
      });
    }

    if (result.parentMismatch) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Parent comment does not belong to this dump.",
      });
    }
  }

  return res.status(201).json({
    success: true,
    data: { id: result.id! },
    message: "Comment posted successfully.",
  });
};

export const dumpCommentsQuerySchema = z.object({
  cursor: z.string().optional(),
  replyingTo: z.string().optional(),
});
export type DumpCommentsQueryType = z.infer<typeof dumpCommentsQuerySchema>;

export const dumpCommentsGetController: Controller<{
  items: CommentItem[];
  nextCursor: string | null;
}> = async (req, res) => {
  const { userId } = req.accessTokenPayload!;
  const dumpId = req.params.dumpId as string;
  const { cursor, replyingTo } = req.query as DumpCommentsQueryType;

  const result = await Dump.getComments({
    dumpId,
    currentUserId: userId,
    cursor,
    replyingTo,
    limit: 10,
  });

  if (!result.success) {
    if (result.notFound === "dump") {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Dump not found.",
      });
    }

    if (result.notFound === "parent_comment") {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Parent comment not found.",
      });
    }

    if (result.parentMismatch) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Parent comment does not belong to this dump.",
      });
    }

    if (result.invalidCursor) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid cursor provided.",
      });
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      items: result.data!,
      nextCursor: result.nextCursor ?? null,
    },
    message: null,
  });
};

export const dumpCommentDeleteSchema = z.object({
  dumpId: z.string().min(1),
  commentId: z.string().min(1),
});
export type DumpCommentDeleteType = z.infer<typeof dumpCommentDeleteSchema>;

export const dumpCommentDeleteController: Controller<null> = async (
  req,
  res,
) => {
  const { userId } = req.accessTokenPayload!;
  const { dumpId, commentId } = req.body as DumpCommentDeleteType;

  const result = await Dump.deleteComment({
    dumpId,
    commentId,
    currentUserId: userId,
  });

  if (!result.success) {
    if (result.notFound === "comment") {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Comment not found.",
      });
    }

    if (result.notFound === "dump") {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Dump not found.",
      });
    }

    if (result.dumpMismatch) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Comment does not belong to this dump.",
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "You do not have permission to delete this comment.",
      });
    }
  }

  return res.status(200).json({
    success: true,
    data: null,
    message: "Comment deleted successfully.",
  });
};
