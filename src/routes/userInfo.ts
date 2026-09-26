import express from "express";
import { validateRequestData } from "../middlewares/validation.js";
import {
  userInfoGetController,
  userInfoGetSchema,
  userInfoPatchController,
  userInfoPatchSchema,
} from "../controllers/userInfo.js";
import { privateEndpoint } from "../middlewares/auth.js";

const userInfoRouter = express.Router();

userInfoRouter.get(
  "/user-info",
  validateRequestData(userInfoGetSchema, "query_param"),
  userInfoGetController,
);
userInfoRouter.patch(
  "/user-info",
  validateRequestData(userInfoPatchSchema, "body"),
  privateEndpoint,
  userInfoPatchController,
);

export default userInfoRouter;
