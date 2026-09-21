import z from "zod";

import { getApiMdFile, registry } from "./openapi.js";
import { otpTypes } from "../utils/constants.js";
import { emailSchema, usernameSchema } from "../utils/validations.js";

export const validationErrorResponseSchema = registry.register(
  "ValidationErrorResponse",
  z
    .object({
      success: z.literal(false),
      message: z.literal("Wrong data sent."),
      data: z.array(
        z.object({
          field: z
            .string()
            .openapi({ description: "The field that has error." }),
          message: z
            .string()
            .openapi({ description: "The error explanation of the field." }),
        }),
      ),
      errorCode: z.literal(-1),
    })
    .openapi({
      description:
        "Returned when the incoming request data fails validation. When validation errors happen, the APIs usually respond with a 400 Bad Request status code and a response body formatted as shown below.",
    }),
);

export const successResponseSchema = registry.register(
  "SuccessResponse",
  z
    .object({
      success: z.literal(true),
      message: z.string(),
      data: z
        .any()
        .nonoptional()
        .openapi({ description: "The data can be any type." }),
    })
    .openapi({ description: "The structure of every success responses." }),
);

export const errorResponseSchema = registry.register(
  "ErrorResponse",
  z
    .object({
      success: z.literal(false),
      message: z.string(),
      data: z
        .any()
        .nonoptional()
        .openapi({ description: "The data can be any type." }),
      errorCode: z.number().optional(),
    })
    .openapi({ description: "The structure of every error responses." }),
);

export const otpTypesSchema = registry.register(
  "OTPType",
  z.enum(otpTypes).openapi({ description: getApiMdFile("otp-types") }),
);

export const userRoleSchema = registry.register(
  "UserRole",
  z
    .enum(["user", "admin"])
    .openapi({ description: "A role that each user can have." }),
);

export const authUserSchema = registry.register(
  "AuthUser",
  z
    .object({
      id: z.uuidv4(),
      email: emailSchema.openapi({ example: "test@example.com" }),
      username: usernameSchema.openapi({ example: "test_user" }),
      displayName: z.string().nullable().openapi({ example: "Test User" }),
      avatar: z.string().nullable(),
      role: userRoleSchema.openapi({ example: "user" }),
      isAccountVerified: z.boolean().openapi({ example: true }),
      isTwoFactorEnabled: z.boolean().openapi({ example: false }),
    })
    .openapi({
      description: "The user data of the current signed in user",
    }),
);
