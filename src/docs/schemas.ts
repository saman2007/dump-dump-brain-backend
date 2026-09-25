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
      role: userRoleSchema.openapi({ example: "user" }),
      isAccountVerified: z.boolean().openapi({ example: true }),
      isTwoFactorEnabled: z.boolean().openapi({ example: false }),
    })
    .openapi({
      description: "The user data of the current signed in user",
    }),
);

export const authComponent = registry.registerComponent(
  "securitySchemes",
  "AuthRequired",
  {
    type: "apiKey",
    scheme: "access_token",
    in: "cookie",
    name: "access_token",
    description:
      "`access_token` key must be in the cookies with value of a JWT token.",
  },
);

export const jwtErrorSchema = registry.register(
  "JWTErrorSchema",
  z.object({
    success: z.literal(false),
    data: z.null(),
    message: z.string(),
    errorCode: z
      .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
      .openapi({
        description: `Specific authentication error codes:
* \`0\`: TokenExpiredError (Token has expired, refresh required)
* \`1\`: JsonWebTokenError (Invalid or malformed token)
* \`2\`: NotBeforeError (Token not active yet)
* \`3\`: ServiceError (Internal or unhandled auth error)`,
        example: 0,
      }),
  }),
);

export const jwtErrorResponse = registry.registerComponent(
  "responses",
  "JWTErrorResponse",
  {
    description:
      "Authentication error - missing, expired, or invalid bearer token",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/JWTErrorSchema" },
        examples: {
          tokenExpired: {
            summary: "Token expired (Code 0)",
            description:
              "Triggered when the access token has passed its expiration time.",
            value: {
              success: false,
              data: null,
              message: "The token has expired, refresh it.",
              errorCode: 0,
            },
          },
          tokenInvalid: {
            summary: "Malformed/Invalid token (Code 1)",
            description:
              "Triggered when the token signature or structure is invalid.",
            value: {
              success: false,
              data: null,
              message: "jwt malformed",
              errorCode: 1,
            },
          },
          tokenNotActive: {
            summary: "Token not active yet (Code 2)",
            description:
              "Triggered when the token contains a future nbf (not before) claim.",
            value: {
              success: false,
              data: null,
              message: "jwt not active",
              errorCode: 2,
            },
          },
          serviceError: {
            summary: "Internal auth service error (Code 3)",
            description:
              "Triggered on unhandled authentication runtime exceptions.",
            value: {
              success: false,
              data: null,
              message: "Authentication failed",
              errorCode: 3,
            },
          },
        },
      },
    },
  },
);
