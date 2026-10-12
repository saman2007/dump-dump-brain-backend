import type { SessionsSelect } from "../../db/schemas/auth/sessions.js";

export type RenderSession = Omit<SessionsSelect, "refreshToken">;
