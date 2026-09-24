import z from "zod";
import { registry } from "../openapi.js";
import { authComponent, jwtErrorResponse } from "../schemas.js";

registry.registerPath({
  method: "get",
  path: "/sessions",
  tags: ["Sessions"],
  security: [{ [authComponent.name]: [] }],
  request: { cookies: z.object({ access_token: z.string() }) },
  description: "An API that returns all active sessions of a user.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(
              z.object({
                id: z.string(),
                createdAt: z.date(),
                userId: z.string(),
                userAgent: z.string().nullable(),
                ipAddress: z.string().nullable(),
                expiresAt: z.date(),
              }),
            ),
            message: z.null(),
          }),
        },
      },
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
  },
});
