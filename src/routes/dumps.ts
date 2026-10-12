import express from "express";

import {
  dumpFeedGetController,
  dumpFeedQuerySchema,
  dumpPatchBodySchema,
  dumpPatchController,
  dumpPostController,
  dumpPostSchema,
  dumpReactionBodySchema,
  dumpReactionPostController,
  dumpViewPostController,
  dumpCommentBodySchema,
  dumpCommentPostController,
  dumpCommentsGetController,
  dumpCommentsQuerySchema,
  dumpCommentDeleteController,
} from "../controllers/dumps.js";
import { privateEndpoint } from "../middlewares/auth.js";
import { validateRequestData } from "../middlewares/validation.js";

const dumpRouter = express.Router();

dumpRouter.get(
  "/dumps/feed",
  validateRequestData(dumpFeedQuerySchema, "query_param"),
  privateEndpoint,
  dumpFeedGetController,
);

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

dumpRouter.post(
  "/dumps/:dumpId/comments",
  validateRequestData(dumpCommentBodySchema, "body"),
  privateEndpoint,
  dumpCommentPostController,
);

dumpRouter.get(
  "/dumps/:dumpId/comments",
  validateRequestData(dumpCommentsQuerySchema, "query_param"),
  privateEndpoint,
  dumpCommentsGetController,
);

dumpRouter.delete(
  "/dumps/:dumpId/comments/:commentId",
  privateEndpoint,
  dumpCommentDeleteController,
);

export default dumpRouter;
