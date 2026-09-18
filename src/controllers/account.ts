import z from "zod";

import type { Controller } from "../types/types.js";
import { Account } from "../services/account.js";

export const verifyAccountSchema = z.object({ actionKey: z.string() });

export type VerifyAccountType = z.infer<typeof verifyAccountSchema>;

export const verifyAccountPostController: Controller = async (req, res) => {
  const { userId } = req.body as VerifyAccountType & { userId: string };

  await Account.verify(userId);

  return res.status(200).json({
    success: true,
    data: null,
    message: "Account verified successfully.",
  });
};
