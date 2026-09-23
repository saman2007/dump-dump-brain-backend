import z from "zod";

import type { RenderSession } from "../db/schemas/sessions.js";
import { Session } from "../services/sessions.js";
import type { Controller } from "../types/types.js";

export const userSessionsGetController: Controller<RenderSession[]> = async (
  req,
  res,
) => {
  const { userId } = req.accessTokenPayload!;

  const sessions = await Session.getAll(userId);

  return res.json({ success: true, data: sessions, message: "" });
};

export const revokeSessionSchema = z.object({ sessionId: z.string().min(1) });

export type RevokeSessionType = z.infer<typeof revokeSessionSchema>;

export const revokeSessionDeleteController: Controller<RenderSession> = async (
  req,
  res,
) => {
  const { sessionId } = req.body as RevokeSessionType;
  const { userId } = req.accessTokenPayload!;

  const deletedSession = await Session.delete(sessionId, userId);

  return res.status(200).json({
    success: true,
    data: deletedSession,
    message: "Deleted the session successfully.",
  });
};
