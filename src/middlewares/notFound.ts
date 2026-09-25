import type { Middleware } from "../types/api.js";

export const notFoundHandler: Middleware = (_, res) => {
  return res
    .status(404)
    .json({ data: null, message: "Route not found.", success: false });
};
