import * as d from "drizzle-orm";
import * as z from "zod";

import db from "../db/db.js";
import { usersTable } from "../db/schemas/users.js";
import { sendOtpEmail } from "../services/email.js";
import { OTP } from "../services/otp.js";
import type { Controller } from "../types/types.js";
import { getColumnsIncludes, ServiceError } from "../utils/utils.js";
import { usernameSchema } from "../utils/validations.js";
import { getApiMdFile } from "../docs/openapi.js";
import { otpTypes } from "../utils/constants.js";

export const attemptOtpSchema = z.object({
  code: z
    .string()
    .meta({ example: "123456", description: "A 6 digits number." }),
  username: usernameSchema.meta({
    example: "test_user",
    description: "The user whose verification code is being verified.",
  }),
  type: z.enum(otpTypes).openapi({
    example: "account_verification",
    description: "The type of OTP that is being verified.",
  }),
});

export type AttemptOtpCodeType = z.infer<typeof attemptOtpSchema>;

export const attemptOtpPostController: Controller<string> = async (
  req,
  res,
  next,
) => {
  const { code, username, type } = req.body as AttemptOtpCodeType;

  const [user] = await db
    .select(getColumnsIncludes(usersTable, ["email", "id"]))
    .from(usersTable)
    .where(d.eq(usersTable.username, username));

  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      message: "User not found.",
      errorCode: 3,
    });
  }

  try {
    const result = await OTP.attempt(code, user.id, type);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.actionKey!,
        message: "Code successfully approved.",
      });
    } else {
      return res.status(400).json({
        success: false,
        data: result.maximumAttemptsExceeded,
        message: "The sent code is wrong.",
        errorCode: 4,
      });
    }
  } catch (err) {
    if (err instanceof ServiceError) {
      switch (err.code) {
        case 0:
          return res.status(400).json({
            success: false,
            data: null,
            message: "No OTP is requested.",
            errorCode: 0,
          });

        case 1:
          return res.status(400).json({
            success: false,
            data: null,
            message: "Maximum attempts exceeded. Please generate a new OTP.",
            errorCode: 1,
          });

        case 2:
          return res.status(400).json({
            success: false,
            data: null,
            message: "The generated OTP is expired. Please generate a new OTP.",
            errorCode: 2,
          });
      }
    }

    next(err);
  }
};

export const generateOtpSchema = z.object({
  username: usernameSchema.meta({
    description: "The username of the user that you want to generate OTP for.",
    example: "test_user",
  }),
  type: z.enum(otpTypes).meta({
    description: getApiMdFile("otp-types"),
    example: "account_verification",
  }),
});

export type GenerateOtpType = z.infer<typeof generateOtpSchema>;

export const generateOtpPostController: Controller<null> = async (
  req,
  res,
  next,
) => {
  const { username, type } = req.body as GenerateOtpType;

  const [user] = await db
    .select(getColumnsIncludes(usersTable, ["email", "id"]))
    .from(usersTable)
    .where(d.eq(usersTable.username, username));

  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      message: "User not found.",
      errorCode: 1,
    });
  }

  try {
    const code = await OTP.generate(user.id, type);

    await sendOtpEmail(user.email, code, username).catch((err) =>
      console.log(err),
    );

    res.status(200).json({
      success: true,
      data: null,
      message:
        "OTP generated successfully and sent to your email, check your email.",
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      switch (err.code) {
        case 0:
          return res.status(400).json({
            success: false,
            data: err.data,
            message:
              "Can't generate a new OTP during the generate cooldown period.",
            errorCode: 0,
          });
      }
    }

    next(err);
  }
};
