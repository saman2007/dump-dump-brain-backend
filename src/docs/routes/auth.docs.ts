import z from "zod";

import { getApiMdFile, registry } from "../openapi.js";
import { signupUserSchema } from "../../controllers/auth.js";

// Signup doc
registry.registerPath({
  method: "post",
  path: "/signup",
  summary: "/signup",
  description: getApiMdFile("signup"),
  tags: ["Auth"],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: signupUserSchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.literal("User created."),
            data: z.null(),
          }),
        },
      },
    },
    409: {
      content: {
        "application/json": {
          schema: z
            .object({
              success: z.literal(false),
              message: z.literal("Data has conflict with DB."),
              data: z
                .array(
                  z.object({
                    field: z.string().openapi({
                      description:
                        "A field of request body which has a problem.",
                    }),
                    message: z.string().openapi({
                      description: "The explanation of field's problem.",
                    }),
                  }),
                )
                .openapi({
                  example: [
                    [
                      {
                        field: "username",
                        message: "A user with the entered username exists.",
                      },
                      {
                        field: "email",
                        message: "A user with the entered email exists.",
                      },
                    ],
                  ],
                }),
            })
            .openapi({
              description:
                "When a user with the info of request body already exists, a response with 409 status will be sent back.",
            }),
        },
      },
    },
  },
});
