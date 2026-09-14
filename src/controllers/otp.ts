import * as d from "drizzle-orm";
import * as z from "zod";

import db from "../db/db.js";
import { usersTable } from "../db/schemas/users.js";
import { sendOtpEmail } from "../services/email.js";
import { OTP } from "../services/otp.js";
import type { Controller } from "../types/types.js";
import { getColumnsIncludes, ServiceError } from "../utils/utils.js";
import { usernameSchema } from "../utils/validations.js";

export const attemptOtpCodeSchema = z.object({
  code: z.string(),
  username: usernameSchema,
  type: z.enum(["account_verification", "password_reset", "two_factor"]),
});

export type AttemptOtpCodeType = z.infer<typeof attemptOtpCodeSchema>;

export const attemptOtpCodePostController: Controller<
  Awaited<ReturnType<(typeof OTP)["attempt"]>>
> = async (req, res, next) => {
  const code = req.body.code;
  const username = req.body.username;
  const type = req.body.type;

  const [user] = await db
    .select(getColumnsIncludes(usersTable, ["email", "id"]))
    .from(usersTable)
    .where(d.eq(usersTable.username, username));

  try {
    const result = await OTP.attempt(code, user.id, type);

    sendOtpEmail(user.email, code, username);

    return res.status(200).json({ success: true, data: result, message: null });
  } catch (err) {
    if (err instanceof ServiceError) {
      switch (err.code) {
        case 0:
          return res.status(400).json({
            success: false,
            data: null,
            message: "No OTP is requested.",
            errorCode: 0,
          });

        case 1:
          return res.status(400).json({
            success: false,
            data: null,
            message: "Maximum attempts exceeded. Please generate a new OTP.",
            errorCode: 1,
          });

        case 2:
          return res.status(400).json({
            success: false,
            data: null,
            message: "The generated OTP is expired. Please generate a new OTP.",
            errorCode: 2,
          });
      }
    }

    next(err);
  }
};
