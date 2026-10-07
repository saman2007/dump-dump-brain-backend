import express from "express";

import {
  dumpPatchBodySchema,
  dumpPatchController,
  dumpPostController,
  dumpPostSchema,
  dumpReactionBodySchema,
  dumpReactionPostController,
} from "../controllers/dumps.js";
import { privateEndpoint } from "../middlewares/auth.js";
import { validateRequestData } from "../middlewares/validation.js";

const dumpRouter = express.Router();

dumpRouter.post(
  "/dumps",
  validateRequestData(dumpPostSchema, "body"),
  privateEndpoint,
  dumpPostController,
);

dumpRouter.patch(
  "/dumps/:dumpId",
  validateRequestData(dumpPatchBodySchema, "body"),
  privateEndpoint,
  dumpPatchController,
);

dumpRouter.post(
  "/dumps/:dumpId/reaction",
  validateRequestData(dumpReactionBodySchema, "body"),
  privateEndpoint,
  dumpReactionPostController,
);

export default dumpRouter;
