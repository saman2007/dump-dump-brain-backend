import * as z from "zod";

export const emailSchema = z.email().trim().toLowerCase().normalize();

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters long")
  .max(30, "Username cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens",
  )
  .regex(/^[a-zA-Z0-9]/, "Username must start with a letter or number")
  .regex(/[a-zA-Z0-9]$/, "Username must end with a letter or number");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password cannot exceed 100 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter");

export const insertUserSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: z
    .string()
    .trim()
    .max(100, "Display name cannot exceed 100 characters")
    .optional(),
});

export type InsertUserInput = z.infer<typeof insertUserSchema>;
