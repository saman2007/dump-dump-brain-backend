import express from "express";
import { validateRequestData } from "../middlewares/validation.js";
import {
  userInfoGetController,
  userInfoGetSchema,
  userInfoPatchController,
  userInfoPatchSchema,
} from "../controllers/user.js";
import { privateEndpoint } from "../middlewares/auth.js";

const usersRouter = express.Router();

usersRouter.get(
  "/user-info",
  validateRequestData(userInfoGetSchema, "query_param"),
  userInfoGetController,
);
usersRouter.patch(
  "/user-info",
  validateRequestData(userInfoPatchSchema, "body"),
  privateEndpoint,
  userInfoPatchController,
);

export default usersRouter;
