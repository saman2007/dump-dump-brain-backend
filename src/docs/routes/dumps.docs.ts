import z from "zod";

import {
  dumpFeedQuerySchema,
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
import { DUMP_MOOD, DUMP_REACTION } from "../../utils/constants.js";


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

export const feedAuthorSchema = registry.register(
  "FeedAuthor",
  z.object({
    id: z.string().uuid(),
    username: z.string(),
    avatar: z.string().nullable(),
    displayName: z.string().nullable(),
  }),
);

export const feedDumpItemSchema = registry.register(
  "FeedDumpItem",
  z.object({
    id: z.string().uuid(),
    content: z.string(),
    mood: z.enum(DUMP_MOOD),
    reactionsCount: z.record(z.enum(DUMP_REACTION), z.number()),
    createdAt: z.date(),
    author: feedAuthorSchema,
  }),
);

// GET /dumps/feed docs
registry.registerPath({
  method: "get",
  path: "/dumps/feed",
  summary: "/dumps/feed",
  description: getApiMdFile("feed-dump"),
  tags: ["Dump"],
  security: [{ [authComponent.name]: [] }],
  request: {
    cookies: z.object({ access_token: z.string() }),
    query: dumpFeedQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              items: z.array(feedDumpItemSchema),
              nextCursor: z.string().optional(),
            }),
            message: z.null(),
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