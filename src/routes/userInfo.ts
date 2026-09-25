import express from "express";
import { validateRequestData } from "../middlewares/validation.js";
import {
  userInfoGetController,
  userInfoGetSchema,
} from "../controllers/userInfo.js";

const userInfoRouter = express.Router();

userInfoRouter.get(
  "/user-info",
  validateRequestData(userInfoGetSchema, "query_param"),
  userInfoGetController,
);

export default userInfoRouter;
