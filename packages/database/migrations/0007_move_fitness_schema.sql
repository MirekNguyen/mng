-- Move strava tables into the "fitness" schema
CREATE SCHEMA IF NOT EXISTS "fitness";

ALTER TABLE "strava_athletes" SET SCHEMA "fitness";
ALTER TABLE "strava_activities" SET SCHEMA "fitness";
ALTER TABLE "strava_streams" SET SCHEMA "fitness";
ALTER TABLE "strava_personal_records" SET SCHEMA "fitness";
ALTER TABLE "strava_webhook_events" SET SCHEMA "fitness";
