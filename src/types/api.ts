import type { Request, Response, NextFunction } from "express";

export interface APISuccess<T = null> {
  success: true;
  message: string | null;
  data: T;
}

export interface APIError {
  success: false;
  message: string;
  data: unknown;
  errorCode?: number;
}

export type APIResponse<T> = APISuccess<T> | APIError;

/**
 * For API middlewares
 *
 * - These kind of middlewares can send success or error api responses.
 */
export type Controller<T = unknown> = (
  req: Request,
  res: Response<APIResponse<T>>,
  next: NextFunction,
) => void;

/**
 * For general middlewares
 *
 * - These kind of middlewares process some general jobs and in case that the general job is failed, they send an error response. Else, they move to the next middleware.
 */
export type Middleware = (
  req: Request,
  res: Response<APIError>,
  next: NextFunction,
) => void;
