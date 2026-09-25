import type { ZodObject } from "zod";
import * as d from "drizzle-orm";
import type { Request } from "express";

import type { Middleware } from "../types/api.js";
import db from "../db/db.js";
import { actionKeysTable, actionTypes } from "../db/schemas/actionKeys.js";
import { hashSHA256 } from "../utils/utils.js";

/**
 * A helper middleware to validate the JSON body or query params of the request before processing the main logic.
 *
 * @param zodSchema A zod schema that must be type of ZodObject
 */
export const validateRequestData: (
  zodSchema: ZodObject,
  dataType: "body" | "query_param" | null,
  getData?: (req: Request) => any,
) => Middleware = (zodSchema, dataType, getData) => async (req, res, next) => {
  const dataMap = {
    body: req.body,
    query_param: req.query,
    header: {},
  };

  let data = getData ? getData(req) : dataMap[dataType!];

  const result = zodSchema.safeParse(data);

  if (result.success) {
    if (dataType === "body") req.body = result.data;
    else if (dataType === "query_param") req.query = result.data as any;

    return next();
  }

  return res.status(400).json({
    success: false,
    message: "Wrong data sent.",
    data: result.error.issues.map(({ message, path }) => ({
      message,
      field: path[0],
    })),
    errorCode: -1,
  });
};

/**
 * A helper middleware that validates the sent `actionKey` for APIs that needs an action key to do an action.
 *
 * - After that the `actionKey` is validated, the id of the user that the `actionKey` belongs to, will be placed in `req.body.userId`.
 *
 * @param type The expected type for the action key.
 */
export const validateActionKey: (
  type: (typeof actionTypes)[number],
) => Middleware = (type) => async (req, res, next) => {
  const actionKey = req.body.actionKey as string;

  const [record] = await db
    .select()
    .from(actionKeysTable)
    .where(
      d.and(
        d.eq(actionKeysTable.keyHash, hashSHA256(actionKey)),
        d.eq(actionKeysTable.type, type),
      ),
    )
    .limit(1);

  if (!record) {
    return res.status(404).json({
      success: false,
      data: null,
      message: "No action key found.",
      errorCode: 0,
    });
  }

  await db
    .delete(actionKeysTable)
    .where(
      d.and(
        d.eq(actionKeysTable.keyHash, hashSHA256(actionKey)),
        d.eq(actionKeysTable.type, type),
      ),
    );

  if (Date.now() - new Date(record.createdAt).valueOf() > 1000 * 60 * 5) {
    return res.status(410).json({
      success: false,
      data: null,
      message: "The actionKey is expired.",
      errorCode: 1,
    });
  }

  req.body.userId = record.userId;

  next();
};
