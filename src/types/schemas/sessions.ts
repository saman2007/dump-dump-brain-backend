import type { SessionsSelect } from "../../db/schemas/sessions.js";

export type RenderSession = Omit<SessionsSelect, "refreshToken">;
