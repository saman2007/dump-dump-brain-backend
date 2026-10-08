import express from "express";

import {
  dumpPatchBodySchema,
  dumpPatchController,
  dumpPostController,
  dumpPostSchema,
  dumpReactionBodySchema,
  dumpReactionPostController,
  dumpViewPostController,
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

dumpRouter.post(
  "/dumps/:dumpId/view",
  privateEndpoint,
  dumpViewPostController,
);

export default dumpRouter;
