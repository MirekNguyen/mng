-- Health export schema: raw HealthKit data ingested from the iOS app.
CREATE SCHEMA IF NOT EXISTS "health";

CREATE TABLE IF NOT EXISTS "health"."devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" varchar(128) NOT NULL,
	"name" varchar(200),
	"model" varchar(100),
	"system_version" varchar(50),
	"api_key_hash" varchar(128) NOT NULL,
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "devices_device_id_unique" UNIQUE("device_id")
);

CREATE TABLE IF NOT EXISTS "health"."samples" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" varchar(128) NOT NULL,
	"healthkit_uuid" varchar(64) NOT NULL,
	"type_identifier" varchar(100) NOT NULL,
	"sample_class" varchar(20) NOT NULL,
	"value" double precision,
	"unit" varchar(40),
	"category_value" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"source_name" varchar(200),
	"source_bundle_id" varchar(200),
	"device_name" varchar(200),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "health"."workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" varchar(128) NOT NULL,
	"healthkit_uuid" varchar(64) NOT NULL,
	"activity_type" integer NOT NULL,
	"activity_name" varchar(80),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"duration" double precision NOT NULL,
	"active_energy" double precision,
	"total_energy" double precision,
	"distance" double precision,
	"avg_heart_rate" integer,
	"max_heart_rate" integer,
	"min_heart_rate" integer,
	"avg_speed" double precision,
	"max_speed" double precision,
	"elevation_ascended" double precision,
	"elevation_descended" double precision,
	"avg_cadence" double precision,
	"avg_power" double precision,
	"avg_met" double precision,
	"step_count" integer,
	"swim_stroke_count" integer,
	"temperature" double precision,
	"humidity" double precision,
	"indoor" boolean,
	"source_name" varchar(200),
	"device_name" varchar(200),
	"route" jsonb,
	"splits" jsonb,
	"heart_rate_zones" jsonb,
	"events" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "health"."workout_series" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_uuid" varchar(64) NOT NULL,
	"metric" varchar(40) NOT NULL,
	"unit" varchar(40),
	"timestamps" jsonb NOT NULL,
	"values" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "health"."sync_anchors" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" varchar(128) NOT NULL,
	"type_identifier" varchar(100) NOT NULL,
	"anchor" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "health"."ingest_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" varchar(128) NOT NULL,
	"kind" varchar(40) NOT NULL,
	"received" integer DEFAULT 0 NOT NULL,
	"inserted" integer DEFAULT 0 NOT NULL,
	"event_time" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "health_devices_api_key_hash_idx" ON "health"."devices" USING btree ("api_key_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "health_samples_uuid_idx" ON "health"."samples" USING btree ("healthkit_uuid");
CREATE INDEX IF NOT EXISTS "health_samples_type_start_idx" ON "health"."samples" USING btree ("type_identifier","start_date");
CREATE INDEX IF NOT EXISTS "health_samples_device_idx" ON "health"."samples" USING btree ("device_id");
CREATE UNIQUE INDEX IF NOT EXISTS "health_workouts_uuid_idx" ON "health"."workouts" USING btree ("healthkit_uuid");
CREATE INDEX IF NOT EXISTS "health_workouts_start_idx" ON "health"."workouts" USING btree ("start_date");
CREATE INDEX IF NOT EXISTS "health_workouts_device_idx" ON "health"."workouts" USING btree ("device_id");
CREATE UNIQUE INDEX IF NOT EXISTS "health_workout_series_idx" ON "health"."workout_series" USING btree ("workout_uuid","metric");
CREATE UNIQUE INDEX IF NOT EXISTS "health_sync_anchors_idx" ON "health"."sync_anchors" USING btree ("device_id","type_identifier");
