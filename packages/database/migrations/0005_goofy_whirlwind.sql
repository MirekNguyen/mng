ALTER TABLE "strava_activities" ALTER COLUMN "strava_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "strava_activities" ALTER COLUMN "athlete_strava_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "strava_personal_records" ALTER COLUMN "activity_strava_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "strava_webhook_events" ALTER COLUMN "object_id" SET DATA TYPE bigint;