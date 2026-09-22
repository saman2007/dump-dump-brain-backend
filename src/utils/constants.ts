export const otpTypes = [
  "account_verification",
  "password_reset",
  "two_factor",
] as const;

export const IS_WEBSITE_SECURE = process.env.WEBSITE_SECURE === "true";
