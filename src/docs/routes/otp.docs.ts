import z from "zod";

import { attemptOtpSchema, generateOtpSchema } from "../../controllers/otp.js";
import { getApiMdFile, registry } from "../openapi.js";
import {
  errorResponseSchema,
  otpTypesSchema,
  validationErrorResponseSchema,
} from "../schemas.js";

// For /otp/generate API
registry.registerPath({
  method: "post",
  path: "/otp/generate",
  summary: "/otp/generate",
  description: getApiMdFile("generate-otp"),
  tags: ["OTP"],
  request: {
    body: {
      content: { "application/json": { schema: generateOtpSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.null(),
            message: z.literal(
              "OTP generated successfully and sent to your email, check your email.",
            ),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": {
          schema: z.union([
            z
              .object({
                success: z.literal(false),
                data: z.number().openapi({
                  example: 1234,
                  description: "The remaining cooldown time in ms.",
                }),
                message: z.literal(
                  "Can't generate a new OTP during the generate cooldown period.",
                ),
                errorCode: z.literal(0),
              })
              .openapi({ title: "CooldownError" }),
            validationErrorResponseSchema,
          ]),
        },
      },
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("User not found."),
            errorCode: z.literal(1),
          }),
        },
      },
    },
  },
});

// For /otp/attempt API
registry.registerPath({
  method: "post",
  path: "/otp/attempt",
  summary: "/otp/attempt",
  tags: ["OTP"],
  description: getApiMdFile("attempt-otp"),
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: attemptOtpSchema.extend({ type: otpTypesSchema }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.string().openapi({
              description: "A 32 bytes random string that is action token.",
            }),
            message: z.literal("Code successfully approved."),
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
            message: z.literal("User not found."),
            errorCode: z.literal(3),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": {
          schema: z.union([errorResponseSchema, validationErrorResponseSchema]),
          examples: {
            NoOTPRequested: {
              value: {
                success: false,
                data: null,
                message: "No OTP is requested.",
                errorCode: 0,
              },
              description:
                "Error code `0`: When the user attempts to verify a code for an OTP that does not exist for the specified user or does not match the specified type.",
            },
            MaximumAttempt: {
              value: {
                success: false,
                data: null,
                message:
                  "Maximum attempts exceeded. Please generate a new OTP.",
                errorCode: 1,
              },
              description:
                "Error code `1`: When the user attempts to send a verification code 5 or more times and all attempts fail.",
            },
            OTPExpired: {
              value: {
                success: false,
                data: null,
                message:
                  "The generated OTP is expired. Please generate a new OTP.",
                errorCode: 2,
              },
              description:
                "Error code `2`: When the user attempts to verify a code for an expired OTP.",
            },
            WrongCode: {
              value: {
                success: false,
                data: false,
                message: "The sent code is wrong.",
                errorCode: 4,
              },
              description:
                "Error code `4`: When the user attempts to verify a code that doesn't match the generated OTP. In this case, the `data` property in response body is a `boolean` indicating whether the user has exceeded the maximum number of attempts or not.",
            },
          },
        },
      },
    },
  },
});
