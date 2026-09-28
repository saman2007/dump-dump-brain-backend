import z from "zod";
import { getApiMdFile, registry } from "../openapi.js";
import {
  authComponent,
  jwtErrorResponse,
  validationErrorResponseSchema,
} from "../schemas.js";
import { usernameSchema } from "../../utils/validations.js";
import {
  followListSchema,
  followSchema,
  socialMediasSchema,
  userInfoGetSchema,
  userInfoPatchSchema,
} from "../../controllers/user.js";

const followItemSchema = z.object({
  id: z.string().uuid(),
  username: usernameSchema,
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
  createdAt: z.date(),
});

registry.registerPath({
  method: "get",
  path: "/user/info",
  summary: "GET /user/info",
  tags: ["User"],
  description: getApiMdFile("get-user-info"),
  request: { query: userInfoGetSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              username: usernameSchema,
              createdAt: z.date(),
              userId: z.string(),
              displayName: z.string().nullable(),
              avatar: z.string().nullable(),
              feeling: z
                .object({ emoji: z.string(), desc: z.string() })
                .nullable(),
              banner: z.string().nullable(),
              bio: z.string().nullable(),
              socialMedias: z.array(socialMediasSchema),
              followersCount: z.number(),
              followingCount: z.number(),
            }),
            message: z.null(),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": { schema: validationErrorResponseSchema },
      },
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("User not found."),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/user/info",
  summary: "PATCH /user/info",
  tags: ["User"],
  security: [{ [authComponent.name]: [] }],
  description: getApiMdFile("patch-user-info"),
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: userInfoPatchSchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.null(),
            message: z.literal("Updated user's info successfully."),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": { schema: validationErrorResponseSchema },
      },
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            data: z.null(),
            message: z.literal("User not found."),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/user/follow",
  summary: "/user/follow",
  tags: ["User"],
  description: getApiMdFile("follow-user"),
  security: [{ [authComponent.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: followSchema } },
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
            message: z.literal("Successfully followed."),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": { schema: validationErrorResponseSchema },
      },
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
  },
});

registry.registerPath({
  method: "post",
  path: "/user/unfollow",
  summary: "/user/unfollow",
  tags: ["User"],
  description: getApiMdFile("unfollow-user"),
  security: [{ [authComponent.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: followSchema } },
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
            message: z.literal("Successfully unfollowed."),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": { schema: validationErrorResponseSchema },
      },
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
  },
});

registry.registerPath({
  method: "get",
  path: "/user/followers-list",
  summary: "/user/followers-list",
  tags: ["User"],
  description: getApiMdFile("followers-list"),
  security: [{ [authComponent.name]: [] }],
  request: { query: followListSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              items: z.array(followItemSchema),
              nextCursor: z.date().nullable(),
            }),
            message: z.null(),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": { schema: validationErrorResponseSchema },
      },
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
  },
});

registry.registerPath({
  method: "get",
  path: "/user/following-list",
  summary: "/user/following-list",
  tags: ["User"],
  description: getApiMdFile("following-list"),
  security: [{ [authComponent.name]: [] }],
  request: { query: followListSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              items: z.array(followItemSchema),
              nextCursor: z.date().nullable(),
            }),
            message: z.null(),
          }),
        },
      },
    },
    400: {
      content: {
        "application/json": { schema: validationErrorResponseSchema },
      },
    },
    401: { $ref: `#/components/responses/${jwtErrorResponse.name}` },
  },
});
