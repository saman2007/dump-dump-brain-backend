import z from "zod";

import { getApiMdFile, registry } from "../openapi.js";
import {
  refreshTokenSchema,
  signin2FASchema,
  signinUserSchema,
  signupUserSchema,
} from "../../controllers/auth.js";
import { authUserSchema, jwtErrorResponse } from "../schemas.js";
import { usernameSchema } from "../../utils/validations.js";

// Sign up doc
registry.registerPath({
  method: "post",
  path: "/auth/signup",
  summary: "/auth/signup",
  description: getApiMdFile("signup"),
  tags: ["Auth"],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: signupUserSchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.literal("User created."),
            data: z.null(),
          }),
        },
      },
    },
    409: {
      content: {
        "application/json": {
          schema: z
            .object({
              success: z.literal(false),
              message: z.literal("Data has conflict with DB."),
              data: z
                .array(
                  z.object({
                    field: z.string().openapi({
                      description:
                        "A field of request body which has a problem.",
                    }),
                    message: z.string().openapi({
                      description: "The explanation of field's problem.",
                    }),
                  }),
                )
                .openapi({
                  example: [
                    [
                      {
                        field: "username",
                        message: "A user with the entered username exists.",
                      },
                      {
                        field: "email",
                        message: "A user with the entered email exists.",
                      },
                    ],
                  ],
                }),
            })
            .openapi({
              description:
                "When a user with the info of request body already exists, a response with 409 status will be sent back.",
            }),
        },
      },
    },
  },
});

// Sign in doc
registry.registerPath({
  method: "post",
  path: "/auth/signin",
  summary: "/auth/signin",
  description: getApiMdFile("signin"),
  tags: ["Auth"],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: signinUserSchema } },
    },
  },
  responses: {
    200: {
      description:
        "If the account's 2FA is not enable, user will be signed in immediately.",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.literal("Signed in successfully."),
            data: authUserSchema,
          }),
        },
      },
      headers: z.object({
        "Set-Cookie": z.string().openapi({
          description: "Contains `refresh_token` and `access_token`.",
        }),
      }),
    },
    202: {
      description:
        "If the account's 2FA is enabled, user needs to verify the sent OTP.",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.literal("An OTP is sent to user's email."),
            data: usernameSchema.openapi({ example: "test_user" }),
          }),
        },
      },
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("Invalid username/email or password."),
            errorCode: z.literal(1),
          }),
        },
      },
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("The user is not verified."),
            errorCode: z.literal(2),
          }),
        },
      },
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("User doesn't exist."),
            errorCode: z.literal(0),
          }),
        },
      },
    },
  },
});

// Sign in 2FA doc
registry.registerPath({
  method: "post",
  path: "/auth/signin/2fa",
  summary: "/auth/signin/2fa",
  tags: ["Auth"],
  description: getApiMdFile("signin-2fa"),
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: signin2FASchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.literal("Signed in successfully."),
            data: authUserSchema,
          }),
        },
      },
      headers: z.object({
        "Set-Cookie": z.string().openapi({
          description: "Contains `refresh_token` and `access_token`.",
        }),
      }),
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  summary: "/auth/refresh",
  tags: ["Auth"],
  description: getApiMdFile("refresh"),
  request: { cookies: refreshTokenSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.null(),
            message: z.literal("Successfully refreshed your access token."),
          }),
        },
      },
      headers: z.object({
        "Set-Cookie": z.string().openapi({
          description: "Contains new `refresh_token` and new `access_token`.",
        }),
      }),
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
  },
});
