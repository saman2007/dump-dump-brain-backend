import * as z from "zod";

import { Auth, User } from "../services/auth.js";
import { OTP } from "../services/otp.js";
import type { Controller } from "../types/types.js";
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
} from "../utils/validations.js";
import { sendOtpEmail, sendWelcomeEmail } from "../services/email.js";
import type { AuthUser } from "../db/schemas/users.js";
import { IS_WEBSITE_SECURE } from "../utils/constants.js";
import { ServiceError } from "../utils/utils.js";

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

export const signinUserSchema = z.object({
  usernameOrEmail: z.union([
    usernameSchema.meta({
      summary: "Username",
      description: "Username",
      example: "test_user",
    }),
    emailSchema.meta({
      summary: "Email",
      description: "Email",
      example: "test@example.com",
    }),
  ]),
  password: z.string().min(1).meta({ example: "123456.ddb" }),
});
export type SigninUserType = z.infer<typeof signinUserSchema>;

export const signinPostController: Controller<AuthUser | string> = async (
  req,
  res,
) => {
  const { usernameOrEmail, password } = req.body as SigninUserType;

  const user = await User.getByUsernameOrEmail(
    usernameOrEmail,
    "NO_TIMESTAMP_USER",
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      message: "User doesn't exist.",
      errorCode: 0,
    });
  }

  const isPasswordValid = await User.checkPassword(user.password, password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Invalid username/email or password.",
      errorCode: 1,
    });
  }

  if (!user.isAccountVerified) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "The user is not verified.",
      errorCode: 2,
    });
  }

  if (user.isTwoFactorEnabled) {
    const otp = await OTP.generate(user.id, "two_factor");

    await sendOtpEmail(user.email, otp, user.username);

    return res.status(202).json({
      success: true,
      message: "An OTP is sent to user's email.",
      data: user.username,
    });
  } else {
    const { password: _, ...authUser } = user;

    const { accessToken, refreshToken } = await Auth.createSession(
      user.id,
      user.role,
      req.ip,
      req.header("User-Agent") || req.header("user-agent"),
    );

    res.cookie("access_token", accessToken, {
      maxAge: Auth.getAccessTokenExpiresAt * 1000,
      httpOnly: true,
      secure: IS_WEBSITE_SECURE,
    });

    res.cookie("refresh_token", refreshToken, {
      maxAge: Auth.getSessionExpiresAt * 1000,
      httpOnly: true,
      secure: IS_WEBSITE_SECURE,
    });

    return res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      data: authUser,
    });
  }
};

export const signin2FASchema = z.object({
  actionKey: z
    .string()
    .min(1)
    .meta({
      description:
        "The action key you got from [attempt OTP API](/docs#tag/otp/POST/otp/attempt).",
    }),
});

export type Signin2FASchema = z.infer<typeof signin2FASchema>;

export const signin2FAPostController: Controller<AuthUser> = async (
  req,
  res,
) => {
  const { userId } = req.body as Signin2FASchema & {
    userId: string;
  };

  const user = (await User.getById(userId, "AUTH_USER"))!;

  const { accessToken, refreshToken } = await Auth.createSession(
    user.id,
    user.role,
    req.ip,
    req.header("User-Agent") || req.header("user-agent"),
  );

  res.cookie("access_token", accessToken, {
    maxAge: Auth.getAccessTokenExpiresAt * 1000,
    httpOnly: true,
    secure: IS_WEBSITE_SECURE,
  });

  res.cookie("refresh_token", refreshToken, {
    maxAge: Auth.getSessionExpiresAt * 1000,
    httpOnly: true,
    secure: IS_WEBSITE_SECURE,
  });

  return res.status(200).json({
    success: true,
    message: "Signed in successfully.",
    data: user,
  });
};

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const refreshTokenPostController: Controller<null> = async (
  req,
  res,
  next,
) => {
  const refreshToken = req.cookies.refresh_token;

  try {
    const { newAccessToken, newRefreshToken, newRefreshTokenExpiresAt } =
      await Auth.refreshAccessToken(refreshToken);

    res.cookie("access_token", newAccessToken, {
      maxAge: Auth.getAccessTokenExpiresAt * 1000,
      httpOnly: true,
      secure: IS_WEBSITE_SECURE,
    });

    res.cookie("refresh_token", newRefreshToken, {
      maxAge: newRefreshTokenExpiresAt * 1000,
      httpOnly: true,
      secure: IS_WEBSITE_SECURE,
    });

    return res.status(200).json({
      success: true,
      data: null,
      message: "Successfully refreshed your access token.",
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: IS_WEBSITE_SECURE,
      });

      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: IS_WEBSITE_SECURE,
      });

      if (err.code === 0) {
        return res.status(401).json({
          success: false,
          data: null,
          message: "The refresh token has expired. Please signin again.",
          errorCode: 0,
        });
      } else if (err.code === 1) {
        return res.status(401).json({
          success: false,
          data: null,
          message: err.data,
          errorCode: 1,
        });
      } else if (err.code === 4) {
        return res.status(401).json({
          success: false,
          data: null,
          message: "The session has been expired. Please signin again.",
          errorCode: 4,
        });
      } else if (err.code === 5) {
        return res.status(401).json({
          success: false,
          data: null,
          message:
            "The session has been terminated because of malicious activities. Please signin again.",
          errorCode: 5,
        });
      } else {
        return res.status(401).json({
          success: false,
          data: null,
          message: err.data,
          errorCode: 0,
        });
      }
    }

    next(err);
  }
};
