import z from "zod";

import type { Controller } from "../types/api.js";
import type {
  FollowInfo,
  NormalUserInfo,
  PatchUserInfo,
} from "../types/schemas/usersInfo.js";
import { usernameSchema } from "../utils/validations.js";
import { UserInfo } from "../services/user.js";

export const feelingSchema = z.object({ emoji: z.string(), desc: z.string() });

export const socialMediasSchema = z.record(z.string(), z.string()).meta({
  description:
    "Map of social media platform names to their profile URLs or usernames",
  example: {
    github: "https://github.com/username",
    twitter: "https://x.com/username",
    linkedin: "https://linkedin.com/in/username",
  },
});

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

export const userInfoPatchSchema = z.object({
  avatar: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  feeling: feelingSchema.nullable().optional(),
  socialMedias: socialMediasSchema.nullable().optional(),
}) satisfies z.ZodType<PatchUserInfo>;

export type UserInfoPatchType = z.infer<typeof userInfoPatchSchema>;

export const userInfoPatchController: Controller<null> = async (req, res) => {
  const patchData = req.body as UserInfoPatchType;
  const { userId } = req.accessTokenPayload!;

  const isUpdated = await UserInfo.update(userId, patchData);

  if (!isUpdated) {
    return res
      .status(404)
      .json({ success: false, message: "User not found.", data: null });
  }

  return res.status(200).json({
    success: true,
    data: null,
    message: "Updated user's info successfully.",
  });
};

