import express from "express";
import { validateRequestData } from "../middlewares/validation.js";
import {
  followSchema,
  followUserPostController,
  unfollowUserPostController,
  userInfoGetController,
  userInfoGetSchema,
  userInfoPatchController,
  userInfoPatchSchema,
} from "../controllers/user.js";
import { privateEndpoint } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get(
  "/user/info",
  validateRequestData(userInfoGetSchema, "query_param"),
  userInfoGetController,
);
userRouter.patch(
  "/user/info",
  validateRequestData(userInfoPatchSchema, "body"),
  privateEndpoint,
  userInfoPatchController,
);
userRouter.post(
  "/user/follow",
  validateRequestData(followSchema, "body"),
  privateEndpoint,
  followUserPostController,
);
userRouter.post(
  "/user/unfollow",
  validateRequestData(followSchema, "body"),
  privateEndpoint,
  unfollowUserPostController,
);

export default userRouter;
