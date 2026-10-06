import express from "express";

import { dumpPostController, dumpPostSchema } from "../controllers/dumps.js";
import { privateEndpoint } from "../middlewares/auth.js";
import { validateRequestData } from "../middlewares/validation.js";

const dumpRouter = express.Router();

dumpRouter.post(
  "/dumps",
  validateRequestData(dumpPostSchema, "body"),
  privateEndpoint,
  dumpPostController,
);

export default dumpRouter;
