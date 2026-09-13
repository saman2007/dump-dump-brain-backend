import express from "express";

import { validateJSONBody } from "../middlewares/validation.js";
import { insertUserSchema } from "../utils/validations.js";
import { signupPostController } from "../controllers/auth.js";

const authRouter = express.Router();

authRouter.post(
  "/auth/signup",
  validateJSONBody(insertUserSchema),
  signupPostController,
);

export default authRouter;
