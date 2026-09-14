import { User } from "../services/auth.js";
import { OTP } from "../services/otp.js";
import type { Controller } from "../types/types.js";
import type { InsertUserInput } from "../utils/validations.js";

export const signupPostController: Controller = async (req, res) => {
  const userData: InsertUserInput = req.body;

  const [isEmailTaken, isUsernameTaken] = await Promise.all([
    User.isEmailTaken(userData.email),
    User.isUsernameTaken(userData.username),
  ]);

  const takenErrors = [];

  if (isEmailTaken)
    takenErrors.push({
      field: "email",
      message: "A user with the entered email exists.",
    });

  if (isUsernameTaken)
    takenErrors.push({
      field: "username",
      message: "A user with the entered username exists.",
    });

  if (takenErrors.length !== 0)
    return res.status(409).json({
      success: false,
      message: "Data has conflict with DB.",
      data: takenErrors,
    });

  const userId = await User.register(userData);

  const otpCode = await OTP.generate(userId, "account_verification");

  return res
    .status(200)
    .json({ success: true, message: "User created.", data: null });
};
