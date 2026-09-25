import z from "zod";
import { getApiMdFile, registry } from "../openapi.js";
import { validationErrorResponseSchema } from "../schemas.js";
import { usernameSchema } from "../../utils/validations.js";
import { userInfoGetSchema } from "../../controllers/userInfo.js";

registry.registerPath({
  method: "get",
  path: "/user-info",
  summary: "/user-info",
  tags: ["User Info"],
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
              socialMedias: z.array(z.record(z.string(), z.string())).openapi({
                description:
                  "Map of social media platform names to their profile URLs or usernames",
                example: {
                  github: "https://github.com/username",
                  twitter: "https://x.com/username",
                  linkedin: "https://linkedin.com/in/username",
                },
              }),
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
