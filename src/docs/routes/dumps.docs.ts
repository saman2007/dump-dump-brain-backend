import z from "zod";

import {
  dumpPatchBodySchema,
  dumpPatchParamsSchema,
  dumpPostSchema,
  dumpReactionBodySchema,
  dumpReactionParamsSchema,
  dumpViewParamsSchema,
} from "../../controllers/dumps.js";
import { getApiMdFile, registry } from "../openapi.js";
import {
  authComponent,
  jwtErrorResponse,
  validationErrorResponseSchema,
} from "../schemas.js";

// POST /dumps docs
registry.registerPath({
  method: "post",
  path: "/dumps",
  summary: "/dumps",
  description: getApiMdFile("post-dump"),
  tags: ["Dump"],
  security: [{ [authComponent.name]: [] }],
  request: {
    cookies: z.object({ access_token: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: dumpPostSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              id: z.uuid(),
            }),
            message: z.literal("Posted dump successfully."),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": {
          schema: validationErrorResponseSchema,
        },
      },
    },
    401: {
      $ref: `#/components/responses/${jwtErrorResponse.name}`,
    },
  },
});

// PATCH /dumps/{dumpId} docs
registry.registerPath({
  method: "patch",
  path: "/dumps/{dumpId}",
  summary: "/dumps/{dumpId}",
  description: getApiMdFile("patch-dump"),
  tags: ["Dump"],
  security: [{ [authComponent.name]: [] }],
  request: {
    cookies: z.object({ access_token: z.string() }),
    params: dumpPatchParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: dumpPatchBodySchema,
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
            data: z.null(),
            message: z.literal("Dump updated successfully."),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": {
          schema: z.union([
            validationErrorResponseSchema,
            z
              .object({
                success: z.literal(false),
                data: z.null(),
                message: z.literal(
                  "At least one of 'content' or 'mood' must be provided.",
                ),
              })
              .openapi({ title: "NoDataProvided" }),
          ]),
        },
      },
    },
    401: {
      $ref: `#/components/responses/${jwtErrorResponse.name}`,
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("Dump not found."),
          }),
        },
      },
    },
  },
});

// POST /dumps/{dumpId}/reaction docs
registry.registerPath({
  method: "post",
  path: "/dumps/{dumpId}/reaction",
  summary: "/dumps/{dumpId}/reaction",
  description: getApiMdFile("reaction-dump"),
  tags: ["Dump"],
  security: [{ [authComponent.name]: [] }],
  request: {
    cookies: z.object({ access_token: z.string() }),
    params: dumpReactionParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: dumpReactionBodySchema,
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
            data: z.null(),
            message: z.string().openapi({
              example: "Reaction added successfully.",
              description:
                "It is one of 'Reaction added successfully.', 'Reaction updated successfully.', or 'Reaction removed successfully.' depending on the action performed.",
            }),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": {
          schema: validationErrorResponseSchema,
        },
      },
    },
    401: {
      $ref: `#/components/responses/${jwtErrorResponse.name}`,
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("Dump not found."),
          }),
        },
      },
    },
  },
});

// POST /dumps/{dumpId}/view docs
registry.registerPath({
  method: "post",
  path: "/dumps/{dumpId}/view",
  summary: "/dumps/{dumpId}/view",
  description: getApiMdFile("view-dump"),
  tags: ["Dump"],
  security: [{ [authComponent.name]: [] }],
  request: {
    cookies: z.object({ access_token: z.string() }),
    params: dumpViewParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.null(),
            message: z.literal("View recorded successfully."),
          }),
        },
      },
    },
    401: {
      $ref: `#/components/responses/${jwtErrorResponse.name}`,
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("Dump not found."),
          }),
        },
      },
    },
  },
});
