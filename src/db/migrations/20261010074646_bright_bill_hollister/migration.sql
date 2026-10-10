CREATE SCHEMA "dumps";
--> statement-breakpoint
CREATE TYPE "dumps"."dump_mood" AS ENUM('sad', 'happy', 'thinking', 'pensive', 'meh', 'angry', 'exhausted', 'confused', 'inspired', 'hyped', 'funny', 'peaceful', 'anxious');--> statement-breakpoint
CREATE TYPE "dumps"."reaction" AS ENUM('understand', 'loved', 'heart_break', 'melting', 'funny', 'mind_blown');--> statement-breakpoint
CREATE TABLE "dumps"."dumps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content" text NOT NULL,
	"author" uuid NOT NULL,
	"mood" "dumps"."dump_mood" NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"hot_score" double precision NOT NULL,
	"reactions_count" jsonb DEFAULT '{"funny":0,"heart_break":0,"loved":0,"melting":0,"mind_blown":0,"understand":0}' NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "dumps"."reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dump_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" "dumps"."reaction" NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dumps"."views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dump_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."action_keys" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3) with time zone USING "created_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "auth"."otps" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3) with time zone USING "created_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3) with time zone USING "created_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3) with time zone USING "created_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3) with time zone USING "updated_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp(3) with time zone USING "deleted_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "profile"."follows" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3) with time zone USING "created_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "profile"."usersInfo" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3) with time zone USING "created_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "profile"."usersInfo" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3) with time zone USING "updated_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "profile"."usersInfo" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp(3) with time zone USING "deleted_at"::timestamp(3) with time zone;--> statement-breakpoint
CREATE INDEX "dump_hot_score_idx" ON "dumps"."dumps" ("hot_score");--> statement-breakpoint
CREATE INDEX "dump_created_at_idx" ON "dumps"."dumps" ("created_at");--> statement-breakpoint
CREATE INDEX "dump_author_idx" ON "dumps"."dumps" ("author");--> statement-breakpoint
CREATE UNIQUE INDEX "user_dump_reaction_unique_idx" ON "dumps"."reactions" ("user_id","dump_id");--> statement-breakpoint
CREATE INDEX "reactions_dump_idx" ON "dumps"."reactions" ("dump_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_dump_view_unique_idx" ON "dumps"."views" ("user_id","dump_id");--> statement-breakpoint
CREATE INDEX "user_views_date_idx" ON "dumps"."views" ("user_id","viewed_at");--> statement-breakpoint
CREATE INDEX "views_dump_id_idx" ON "dumps"."views" ("dump_id");--> statement-breakpoint
ALTER TABLE "dumps"."dumps" ADD CONSTRAINT "dumps_author_users_id_fkey" FOREIGN KEY ("author") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dumps"."reactions" ADD CONSTRAINT "reactions_dump_id_dumps_id_fkey" FOREIGN KEY ("dump_id") REFERENCES "dumps"."dumps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dumps"."reactions" ADD CONSTRAINT "reactions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dumps"."views" ADD CONSTRAINT "views_dump_id_dumps_id_fkey" FOREIGN KEY ("dump_id") REFERENCES "dumps"."dumps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dumps"."views" ADD CONSTRAINT "views_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;