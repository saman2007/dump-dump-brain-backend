import { User } from "../services/auth.js";
import type { Controller } from "../types/types.js";
import type { InsertUserInput } from "../utils/validations.js";

export const signupPostController: Controller = async (req, res) => {
  const userData: InsertUserInput = req.body;

  await User.register(userData);

  return res
    .status(200)
    .json({ success: true, message: "User created.", data: null });
};
