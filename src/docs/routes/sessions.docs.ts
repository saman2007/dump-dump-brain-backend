import z from "zod";
import { getApiMdFile, registry } from "../openapi.js";
import { authComponent, jwtErrorResponse } from "../schemas.js";

const renderSessionSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  userId: z.string(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  expiresAt: z.date(),
});

// /sessions docs
registry.registerPath({
  method: "get",
  path: "/sessions",
  summary: "/sessions",
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
            data: z.array(renderSessionSchema),
            message: z.null(),
          }),
        },
      },
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
  },
});

// /sessions/revoke docs
registry.registerPath({
  method: "delete",
  path: "/sessions/revoke",
  summary: "/sessions/revoke",
  security: [{ [authComponent.name]: [] }],
  tags: ["Sessions"],
  request: { cookies: z.object({ access_token: z.string() }) },
  description: getApiMdFile("revoke-sessions"),
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: renderSessionSchema.openapi({
              description: "The revoked session",
            }),
            message: z.literal("Revoked the session successfully."),
          }),
        },
      },
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
  },
});
