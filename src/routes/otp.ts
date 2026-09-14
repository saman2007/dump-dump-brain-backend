import express from "express";

import {
  attemptOtpCodePostController,
  attemptOtpCodeSchema,
} from "../controllers/otp.js";
import { validateRequestData } from "../middlewares/validation.js";

const otpRouter = express.Router();

otpRouter.post(
  "/otp/attempt",
  validateRequestData(attemptOtpCodeSchema, "body"),
  attemptOtpCodePostController,
);

export default otpRouter;
