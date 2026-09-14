import express from "express";

import { validateRequestData } from "../middlewares/validation.js";
import { signupUserSchema, signupPostController } from "../controllers/auth.js";

const authRouter = express.Router();

authRouter.post(
  "/auth/signup",
  validateRequestData(signupUserSchema, "body"),
  signupPostController,
);

export default authRouter;
