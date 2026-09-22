import z from "zod";

import { verifyAccountSchema } from "../../controllers/account.js";
import { getApiMdFile, registry } from "../openapi.js";

registry.registerPath({
  method: "post",
  path: "/account/verify",
  summary: "/account/verify",
  description: getApiMdFile("verify-account"),
  tags: ["Account"],
  request: {
    body: { content: { "application/json": { schema: verifyAccountSchema } } },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.null(),
            message: z.literal("Account verified successfully."),
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
            message: z.literal("No action key found."),
            errorCode: z.literal(0),
          }),
        },
      },
    },
    410: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("The actionKey is expired."),
            errorCode: z.literal(1),
          }),
        },
      },
    },
  },
});
