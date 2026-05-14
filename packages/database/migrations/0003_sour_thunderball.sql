CREATE TABLE "video_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" varchar(50) NOT NULL,
	"video_url" varchar(500) NOT NULL,
	"title" varchar(500) NOT NULL,
	"channel_name" varchar(255) NOT NULL,
	"thumbnail_url" varchar(500),
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_summaries_video_id_unique" UNIQUE("video_id")
);
