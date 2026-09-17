import z from "zod";

import { generateOtpSchema } from "../../controllers/otp.js";
import { getApiMdFile, registry } from "../openapi.js";
import { errorResponseSchema } from "../schemas.js";

registry.registerPath({
  method: "post",
  path: "/otp/generate",
  summary: "/otp/generate",
  description: getApiMdFile("generate-otp"),
  tags: ["OTP"],
  request: {
    body: { content: { "application/json": { schema: generateOtpSchema } } },
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
          schema: z.object({
            success: z.literal(false),
            data: z.number().openapi({
              example: 1234,
              description: "The remaining cooldown time in ms.",
            }),
            message: z.literal(
              "Can't generate a new OTP during the generate cooldown period.",
            ),
            errorCode: z.literal(0),
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
            errorCode: z.literal(1),
          }),
        },
      },
    },
  },
});
