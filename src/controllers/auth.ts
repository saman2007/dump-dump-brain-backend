import * as z from "zod";

import { User } from "../services/auth.js";
import { OTP } from "../services/otp.js";
import type { Controller } from "../types/types.js";
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
} from "../utils/validations.js";
import { sendOtpEmail, sendWelcomeEmail } from "../services/email.js";

export const signupUserSchema = z.object({
  email: emailSchema.meta({ example: "test@example.com" }),
  username: usernameSchema.meta({
    description:
      "Username can only contain letters, numbers, underscores, and hyphens.",
    example: "test_user",
  }),
  password: passwordSchema.meta({
    description: "Password must contain at least one letter.",
    example: "12345678.ddb",
  }),
  displayName: z
    .string()
    .trim()
    .max(100, "Display name cannot exceed 100 characters.")
    .optional()
    .meta({ example: "Test User" }),
});

export type SignupUserType = z.infer<typeof signupUserSchema>;

export const signupPostController: Controller = async (req, res) => {
  const userData: SignupUserType = req.body;

  const [isEmailTaken, isUsernameTaken] = await Promise.all([
    User.isEmailTaken(userData.email),
    User.isUsernameTaken(userData.username),
  ]);

  const takenErrors: { field: string; message: string }[] = [];

  if (isEmailTaken)
    takenErrors.push({
      field: "email",
      message: "A user with the entered email exists.",
    });

  if (isUsernameTaken)
    takenErrors.push({
      field: "username",
      message: "A user with the entered username exists.",
    });

  if (takenErrors.length !== 0)
    return res.status(409).json({
      success: false,
      message: "Data has conflict with DB.",
      data: takenErrors,
    });

  const userId = await User.register(userData);

  const otp = await OTP.generate(userId, "account_verification");

  sendWelcomeEmail(userData.email, userData.username);

  await sendOtpEmail(userData.email, otp, userData.username);

  return res
    .status(200)
    .json({ success: true, message: "User created.", data: null });
};
