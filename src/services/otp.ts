import * as d from "drizzle-orm";
import bcrypt from "bcrypt";

import db from "../db/db.js";
import { otpsTable, type OTPType } from "../db/schemas/otps.js";
import {
  generateOTP,
  getColumnsIncludes,
  ServiceError,
} from "../utils/utils.js";

export class OTP {
  /**
   * A method that generates an OTP for a user.
   *
   * Service error codes:
   * - `0`: It means that the generate request is sent in resend OTP cooldown. The error data is the remaining time of cooldown. The resend cooldown is 1 minute.
   */
  public static async generate(userId: string, type: OTPType): Promise<string> {
    const [lastOTP] = await db
      .select(getColumnsIncludes(otpsTable, ["id", "createdAt"]))
      .from(otpsTable)
      .where(d.and(d.eq(otpsTable.userId, userId), d.eq(otpsTable.type, type)))
      .limit(1);

    if (lastOTP) {
      const timeDiff = Date.now() - lastOTP.createdAt.valueOf();

      if (timeDiff <= 1000 * 60) throw new ServiceError(timeDiff, 0);
    }

    const otp = await generateOTP(6);

    const otpData: typeof otpsTable.$inferInsert = {
      code: await bcrypt.hash(otp, 10),
      attempts: 0,
      type,
      expiresAt: new Date(Date.now() + 5 * 1000 * 60),
      userId,
    };

    if (lastOTP) {
      await db
        .update(otpsTable)
        .set({ ...otpData, createdAt: new Date() })
        .where(d.eq(otpsTable.id, lastOTP.id));
    } else {
      await db.insert(otpsTable).values(otpData);
    }

    return otp;
  }

  /**
   * A method that attempts an OTP for a user.
   *
   * Service error codes:
   * - `0`: It means that there is no OTP requested.
   * - `1`: It means that maximum attempts exceeded. Maximum attempt is 5.
   * - `2`: The OTP is expired and you need to request a new OTP. OTP expires in 5 minutes.
   */
  public static async attempt(code: string, userId: string, type: OTPType) {
    const [otpRequest] = await db
      .select(
        getColumnsIncludes(otpsTable, ["attempts", "code", "expiresAt", "id"]),
      )
      .from(otpsTable)
      .where(d.and(d.eq(otpsTable.userId, userId), d.eq(otpsTable.type, type)))
      .limit(1);

    if (!otpRequest) {
      throw new ServiceError(null, 0);
    }

    if (new Date() > otpRequest.expiresAt) {
      throw new ServiceError(null, 2);
    }

    if (otpRequest.attempts >= 5) {
      throw new ServiceError(null, 1);
    }

    const isValid = await bcrypt.compare(code, otpRequest.code);

    if (isValid) {
      await db.delete(otpsTable).where(d.eq(otpsTable.id, otpRequest.id));

      return {
        maximumTryExceeded: false,
        success: true,
      };
    } else {
      await db
        .update(otpsTable)
        .set({ attempts: otpRequest.attempts + 1 })
        .where(d.eq(otpsTable.id, otpRequest.id));

      return {
        maximumTryExceeded: otpRequest.attempts + 1 >= 5,
        success: true,
      };
    }
  }
}
