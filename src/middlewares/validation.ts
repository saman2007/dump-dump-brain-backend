import type { ZodObject } from "zod";

import type { Middleware } from "../types/types.js";

/**
 * A helper middleware to validate the JSON body of the request before processing the main logic.
 * 
 * @param zodSchema A zod schema that must be type of ZodObject 
 */
export const validateJSONBody: (zodSchema: ZodObject) => Middleware =
  (zodSchema) => async (req, res, next) => {
    const result = zodSchema.safeParse(req.body);

    if (result.success) {
      req.body = result.data;

      return next();
    }

    return res
      .status(422)
      .json({
        success: false,
        message: "Wrong data sent.",
        data: result.error.issues.map(({ message }) => message),
      });
  };
