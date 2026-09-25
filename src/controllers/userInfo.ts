import z from "zod";

import type { Controller } from "../types/api.js";
import type { FollowInfo, NormalUserInfo } from "../types/schemas/usersInfo.js";
import { usernameSchema } from "../utils/validations.js";
import { UserInfo } from "../services/userInfo.js";

export const userInfoGetSchema = z.object({ username: usernameSchema });
export type UserInfoGetType = z.infer<typeof userInfoGetSchema>;

export const userInfoGetController: Controller<
  NormalUserInfo & FollowInfo
> = async (req, res) => {
  const { username } = req.query as UserInfoGetType;

  const userInfo = await UserInfo.get(username);
  const followCounts = await UserInfo.getFollowCount(username);

  if (!userInfo || !followCounts) {
    return res
      .status(404)
      .json({ success: false, data: null, message: "User not found." });
  }

  return res.status(200).json({
    success: true,
    data: { ...userInfo, ...followCounts },
    message: null,
  });
};
