import express from "express";

import {
  attemptOtpPostController,
  attemptOtpSchema,
  generateOtpPostController,
  generateOtpSchema,
} from "../controllers/otp.js";
import { validateRequestData } from "../middlewares/validation.js";

const otpRouter = express.Router();

otpRouter.post(
  "/otp/attempt",
  validateRequestData(attemptOtpSchema, "body"),
  attemptOtpPostController,
);

otpRouter.post(
  "/otp/generate",
  validateRequestData(generateOtpSchema, "body"),
  generateOtpPostController,
);

export default otpRouter;
