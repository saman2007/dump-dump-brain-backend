import z from "zod";

import { registry } from "./openapi.js";

export const validationErrorResponseSchema = registry.register(
  "ValidationErrorResponse",
  z
    .object({
      success: z.literal(false),
      message: z.literal("Wrong data sent."),
      data: z.array(
        z.object({
          field: z
            .string()
            .openapi({ description: "The field that has error." }),
          message: z
            .string()
            .openapi({ description: "The error explanation of the field." }),
        }),
      ),
      errorCode: z.literal(-1),
    })
    .openapi({
      description:
        "Returned when the incoming request data fails validation. When validation errors happen, the APIs usually respond with a 400 Bad Request status code and a response body formatted as shown below.",
    }),
);

export const successResponseSchema = registry.register(
  "SuccessResponse",
  z
    .object({
      success: z.literal(true),
      message: z.string(),
      data: z
        .any()
        .nonoptional()
        .openapi({ description: "The data can be any type." }),
    })
    .openapi({ description: "The structure of every success responses." }),
);

export const errorResponseSchema = registry.register(
  "ErrorResponse",
  z
    .object({
      success: z.literal(false),
      message: z.string(),
      data: z
        .any()
        .nonoptional()
        .openapi({ description: "The data can be any type." }),
      errorCode: z.number().optional(),
    })
    .openapi({ description: "The structure of every error responses." }),
);
