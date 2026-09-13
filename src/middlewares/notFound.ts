import type { Middleware } from "../types/types.js";

export const notFoundHandler: Middleware = (_, res) => {
  return res
    .status(404)
    .json({ data: null, message: "Route not found.", success: false });
};
