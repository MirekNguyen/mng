CREATE TABLE "strava_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"strava_id" integer NOT NULL,
	"athlete_strava_id" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"type" varchar(50) NOT NULL,
	"sport_type" varchar(50) NOT NULL,
	"distance" double precision DEFAULT 0 NOT NULL,
	"moving_time" integer DEFAULT 0 NOT NULL,
	"elapsed_time" integer DEFAULT 0 NOT NULL,
	"total_elevation_gain" double precision DEFAULT 0 NOT NULL,
	"start_date" timestamp NOT NULL,
	"start_date_local" timestamp NOT NULL,
	"average_speed" double precision DEFAULT 0 NOT NULL,
	"max_speed" double precision DEFAULT 0 NOT NULL,
	"average_heartrate" double precision,
	"max_heartrate" double precision,
	"suffer_score" integer,
	"kudos_count" integer DEFAULT 0,
	"has_heartrate" boolean DEFAULT false,
	"average_cadence" double precision,
	"average_watts" double precision,
	"kilojoules" double precision,
	"calories" double precision,
	"map_polyline" text,
	"best_efforts" jsonb,
	"splits" jsonb,
	"laps" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "strava_activities_strava_id_unique" UNIQUE("strava_id")
);
--> statement-breakpoint
CREATE TABLE "strava_athletes" (
	"id" serial PRIMARY KEY NOT NULL,
	"strava_id" integer NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"profile_image_url" varchar(500),
	"city" varchar(100),
	"country" varchar(100),
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" integer NOT NULL,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "strava_athletes_strava_id_unique" UNIQUE("strava_id")
);
--> statement-breakpoint
CREATE TABLE "strava_personal_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete_strava_id" integer NOT NULL,
	"activity_strava_id" integer NOT NULL,
	"distance_name" varchar(50) NOT NULL,
	"distance_meters" double precision NOT NULL,
	"elapsed_time" integer NOT NULL,
	"moving_time" integer NOT NULL,
	"achieved_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strava_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"object_type" varchar(20) NOT NULL,
	"object_id" integer NOT NULL,
	"aspect_type" varchar(20) NOT NULL,
	"owner_strava_id" integer NOT NULL,
	"subscription_id" integer NOT NULL,
	"event_time" integer NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
