export const otpTypes = [
  "account_verification",
  "password_reset",
  "two_factor",
] as const;

export const IS_WEBSITE_SECURE = process.env.WEBSITE_SECURE === "true";

export const DUMP_MOOD = [
  "sad",
  "happy",
  "thinking",
  "pensive",
  "meh",
  "angry",
  "exhausted",
  "confused",
  "inspired",
  "hyped",
  "funny",
  "peaceful",
  "anxious",
] as const;

export const DUMP_REACTION = [
  "understand",
  "loved",
  "heart_break",
  "melting",
  "funny",
  "mind_blown",
] as const;
