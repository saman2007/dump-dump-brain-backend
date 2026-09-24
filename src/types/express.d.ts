import "express";

import type { AccessTokenPayload } from "../services/auth.ts";

declare module "express" {
  interface Request {
    accessTokenPayload?: AccessTokenPayload;
  }
}
