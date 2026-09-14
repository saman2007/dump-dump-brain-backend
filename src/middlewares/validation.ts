import type { ZodObject } from "zod";

import type { Middleware } from "../types/types.js";

/**
 * A helper middleware to validate the JSON body or query params of the request before processing the main logic.
 *
 * @param zodSchema A zod schema that must be type of ZodObject
 */
export const validateRequestData: (
  zodSchema: ZodObject,
  dataType: "body" | "query_param",
) => Middleware = (zodSchema) => async (req, res, next) => {
  const dataMap = {
    body: req.body,
    query_param: req.query,
  };

  let data = dataMap[dataType];

  const result = zodSchema.safeParse(data);

  if (result.success) {
    if (dataType === "body") req.body = result.data;
    else if (dataType === "query_param") req.query = result.data;

    return next();
  }

  return res.status(400).json({
    success: false,
    message: "Wrong data sent.",
    data: result.error.issues.map(({ message, path }) => ({
      message,
      field: path[0],
    })),
  });
};
