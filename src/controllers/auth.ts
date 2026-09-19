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
import type { AuthUser } from "../db/schemas/users.js";

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

export const SigninUserSchema = z.object({
  usernameOrEmail: usernameSchema.or(emailSchema),
  password: z.string().min(1),
});
export type SigninUserType = z.infer<typeof SigninUserSchema>;

export const signinPostController: Controller<{
  user: AuthUser | null;
  is2FAEnabled: boolean;
}> = async (req, res) => {
  const { usernameOrEmail, password } = req.body as SigninUserType;

  const user = await User.getByUsernameOrEmail(
    usernameOrEmail,
    "NO_TIMESTAMP_USER",
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Invalid username/email or password.",
      errorCode: 0,
    });
  }

  const isPasswordValid = await User.checkPassword(user.password, password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Invalid username/email or password.",
      errorCode: 0,
    });
  }

  if (!user.isAccountVerified) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "The user is not verified.",
      errorCode: 1,
    });
  }

  if (user.isTwoFactorEnabled) {
    await OTP.generate(user.id, "two_factor");

    return res.status(200).json({
      success: true,
      message: "An OTP is sent to user's email.",
      data: { user: null, is2FAEnabled: true },
    });
  } else {
    const { password: _, ...authUser } = user;

    return res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      data: { is2FAEnabled: false, user: authUser },
    });
  }
};

export const signin2FASchema = z.object({ actionKey: z.string() });

export type Signin2FASchema = z.infer<typeof signin2FASchema>;

export const signin2FAPostController: Controller = async (req, res) => {
  const { userId } = req.body as Signin2FASchema & {
    userId: string;
  };

  const user = await User.getById(userId, "AUTH_USER");

  return res.status(200).json({
    success: true,
    message: "Signed in successfully.",
    data: user,
  });
};
