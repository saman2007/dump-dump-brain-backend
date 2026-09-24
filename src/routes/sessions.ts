import express from "express";
import { privateEndpoint } from "../middlewares/auth.js";
import {
  revokeSessionDeleteController,
  revokeSessionSchema,
  userSessionsGetController,
} from "../controllers/sessions.js";
import { validateRequestData } from "../middlewares/validation.js";

const sessionsRouter = express.Router();

sessionsRouter.get("/sessions", privateEndpoint, userSessionsGetController);
sessionsRouter.delete(
  "/sessions/revoke",
  privateEndpoint,
  validateRequestData(revokeSessionSchema, "body"),
  revokeSessionDeleteController,
);

export default sessionsRouter;
