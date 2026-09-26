import z from "zod";
import { getApiMdFile, registry } from "../openapi.js";
import {
  authComponent,
  jwtErrorResponse,
  validationErrorResponseSchema,
} from "../schemas.js";
import { usernameSchema } from "../../utils/validations.js";
import {
  socialMediasSchema,
  userInfoGetSchema,
  userInfoPatchSchema,
} from "../../controllers/user.js";

// GET /user-info
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

// PATCH /user-info
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
