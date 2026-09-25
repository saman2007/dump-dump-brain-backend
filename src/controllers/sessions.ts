import z from "zod";

import type { RenderSession } from "../types/schemas/sessions.js";
import { Session } from "../services/sessions.js";
import type { Controller } from "../types/api.js";

export const userSessionsGetController: Controller<RenderSession[]> = async (
  req,
  res,
) => {
  const { userId } = req.accessTokenPayload!;

  const sessions = await Session.getAll(userId);

  return res.json({ success: true, data: sessions, message: null });
};

export const revokeSessionSchema = z.object({ sessionId: z.string().min(1) });

export type RevokeSessionType = z.infer<typeof revokeSessionSchema>;

export const revokeSessionDeleteController: Controller<RenderSession> = async (
  req,
  res,
) => {
  const { sessionId } = req.body as RevokeSessionType;
  const { userId } = req.accessTokenPayload!;

  const revokedSession = (await Session.revoke(sessionId, userId)) ?? null;

  return res.status(200).json({
    success: true,
    data: revokedSession,
    message: "Revoked the session successfully.",
  });
};
