import express from "express";

import {
  validateActionKey,
  validateRequestData,
} from "../middlewares/validation.js";
import {
  signupUserSchema,
  signupPostController,
  signinUserSchema,
  signinPostController,
  signin2FASchema,
  refreshTokenPostController,
  refreshTokenSchema,
  signin2FAPostController,
  getMeGetController,
  signoutPostController,
} from "../controllers/auth.js";
import { privateEndpoint } from "../middlewares/auth.js";

const authRouter = express.Router();

authRouter.post(
  "/auth/signup",
  validateRequestData(signupUserSchema, "body"),
  signupPostController,
);
authRouter.post(
  "/auth/signin",
  validateRequestData(signinUserSchema, "body"),
  signinPostController,
);
authRouter.post(
  "/auth/signin/2fa",
  validateRequestData(signin2FASchema, "body"),
  validateActionKey("two_factor"),
  signin2FAPostController,
);
authRouter.post(
  "/auth/refresh",
  validateRequestData(refreshTokenSchema, null, (req) => {
    return { refresh_token: req.cookies.refresh_token };
  }),
  refreshTokenPostController,
);
authRouter.get("/auth/me", privateEndpoint, getMeGetController);
authRouter.post("/auth/signout", privateEndpoint, signoutPostController);

export default authRouter;
