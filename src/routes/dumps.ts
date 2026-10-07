import express from "express";

import {
  dumpPatchBodySchema,
  dumpPatchController,
  dumpPostController,
  dumpPostSchema,
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

export default dumpRouter;
