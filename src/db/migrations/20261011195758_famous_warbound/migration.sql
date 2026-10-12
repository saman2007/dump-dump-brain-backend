CREATE TABLE "dumps"."comment_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dumps"."comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content" text NOT NULL,
	"dump_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"replying_to" uuid,
	"likes" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_comment_like_unique_idx" ON "dumps"."comment_likes" ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "comment_likes_comment_idx" ON "dumps"."comment_likes" ("comment_id");--> statement-breakpoint
CREATE INDEX "replying_to_idx" ON "dumps"."comments" ("replying_to");--> statement-breakpoint
CREATE INDEX "comments_dump_created_at_idx" ON "dumps"."comments" ("dump_id","created_at");--> statement-breakpoint
ALTER TABLE "dumps"."comment_likes" ADD CONSTRAINT "comment_likes_comment_id_comments_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "dumps"."comments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dumps"."comment_likes" ADD CONSTRAINT "comment_likes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dumps"."comments" ADD CONSTRAINT "comments_dump_id_dumps_id_fkey" FOREIGN KEY ("dump_id") REFERENCES "dumps"."dumps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dumps"."comments" ADD CONSTRAINT "comments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dumps"."comments" ADD CONSTRAINT "comments_replying_to_comments_id_fkey" FOREIGN KEY ("replying_to") REFERENCES "dumps"."comments"("id") ON DELETE CASCADE;