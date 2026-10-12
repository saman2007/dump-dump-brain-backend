CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "profile";
--> statement-breakpoint
ALTER TYPE "action_type" SET SCHEMA "auth";--> statement-breakpoint
ALTER TYPE "otp_type" SET SCHEMA "auth";--> statement-breakpoint
ALTER TYPE "user_role" SET SCHEMA "auth";--> statement-breakpoint
ALTER TABLE "action_keys" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "otps" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "sessions" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "users" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "follows" SET SCHEMA "profile";
--> statement-breakpoint
ALTER TABLE "usersInfo" SET SCHEMA "profile";
