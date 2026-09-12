import type { Request, Response, NextFunction } from "express";
import type { APIError, APISuccess } from "./interfaces.js";
import type { Table } from "drizzle-orm";

export type APIResponse<T> = APISuccess<T> | APIError<T>;

export type Controller<T = unknown> = (
  req: Request,
  res: Response<APIResponse<T>>,
  next: NextFunction,
) => void;