import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

// Strava athlete (OAuth tokens + profile)
export const stravaAthletes = pgTable("strava_athletes", {
  id: serial("id").primaryKey(),
  stravaId: integer("strava_id").notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiresAt: integer("token_expires_at").notNull(),
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const selectStravaAthleteSchema = createSelectSchema(stravaAthletes);
export const insertStravaAthleteSchema = createInsertSchema(stravaAthletes);
export type StravaAthlete = z.infer<typeof selectStravaAthleteSchema>;
export type CreateStravaAthlete = z.infer<typeof insertStravaAthleteSchema>;

// Strava activities (full detailed data)
export const stravaActivities = pgTable("strava_activities", {
  id: serial("id").primaryKey(),
  stravaId: bigint("strava_id", { mode: "number" }).notNull().unique(),
  athleteStravaId: bigint("athlete_strava_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  sportType: varchar("sport_type", { length: 50 }).notNull(),
  distance: doublePrecision("distance").notNull().default(0),
  movingTime: integer("moving_time").notNull().default(0),
  elapsedTime: integer("elapsed_time").notNull().default(0),
  totalElevationGain: doublePrecision("total_elevation_gain").notNull().default(0),
  elevHigh: doublePrecision("elev_high"),
  elevLow: doublePrecision("elev_low"),
  startDate: timestamp("start_date").notNull(),
  startDateLocal: timestamp("start_date_local").notNull(),
  timezone: varchar("timezone", { length: 100 }),
  averageSpeed: doublePrecision("average_speed").notNull().default(0),
  maxSpeed: doublePrecision("max_speed").notNull().default(0),
  averageHeartrate: doublePrecision("average_heartrate"),
  maxHeartrate: doublePrecision("max_heartrate"),
  sufferScore: integer("suffer_score"),
  kudosCount: integer("kudos_count").default(0),
  commentCount: integer("comment_count").default(0),
  photoCount: integer("photo_count").default(0),
  achievementCount: integer("achievement_count").default(0),
  prCount: integer("pr_count").default(0),
  hasHeartrate: boolean("has_heartrate").default(false),
  averageCadence: doublePrecision("average_cadence"),
  averageWatts: doublePrecision("average_watts"),
  weightedAverageWatts: doublePrecision("weighted_average_watts"),
  maxWatts: integer("max_watts"),
  deviceWatts: boolean("device_watts").default(false),
  kilojoules: doublePrecision("kilojoules"),
  calories: doublePrecision("calories"),
  averageTemp: integer("average_temp"),
  deviceName: varchar("device_name", { length: 200 }),
  // Gear
  gearId: varchar("gear_id", { length: 50 }),
  gearName: varchar("gear_name", { length: 200 }),
  // Map
  mapPolyline: text("map_polyline"),
  mapSummaryPolyline: text("map_summary_polyline"),
  startLatlng: jsonb("start_latlng"), // [lat, lng]
  endLatlng: jsonb("end_latlng"), // [lat, lng]
  // Photos
  photos: jsonb("photos"), // {primary: {urls: {...}}, count: N, all: [...]}
  // Social
  kudos: jsonb("kudos"), // [{firstname, lastname, profile}]
  comments: jsonb("comments"), // [{athlete: {firstname, lastname, profile}, text, created_at}]
  // AI
  aiAnalysis: jsonb("ai_analysis"), // cached workout analysis from AI
  // Structured data
  bestEfforts: jsonb("best_efforts"),
  splitsMetric: jsonb("splits_metric"),
  splitsStandard: jsonb("splits_standard"),
  laps: jsonb("laps"),
  segmentEfforts: jsonb("segment_efforts"),
  // Flags
  isTrainer: boolean("is_trainer").default(false),
  isCommute: boolean("is_commute").default(false),
  workoutType: integer("workout_type"),
  // Timestamps
  detailSyncedAt: timestamp("detail_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const selectStravaActivitySchema = createSelectSchema(stravaActivities);
export const insertStravaActivitySchema = createInsertSchema(stravaActivities);
export type StravaActivity = z.infer<typeof selectStravaActivitySchema>;
export type CreateStravaActivity = z.infer<typeof insertStravaActivitySchema>;

// Activity streams (time-series data: HR, pace, elevation, power, cadence)
export const stravaStreams = pgTable("strava_streams", {
  id: serial("id").primaryKey(),
  activityStravaId: bigint("activity_strava_id", { mode: "number" }).notNull().unique(),
  time: jsonb("time"), // integer[] seconds from start
  distance: jsonb("distance"), // float[] meters from start
  altitude: jsonb("altitude"), // float[] meters
  heartrate: jsonb("heartrate"), // integer[] bpm
  cadence: jsonb("cadence"), // integer[] rpm
  watts: jsonb("watts"), // integer[] watts
  velocitySmooth: jsonb("velocity_smooth"), // float[] m/s
  gradeSmooth: jsonb("grade_smooth"), // float[] percent
  latlng: jsonb("latlng"), // [lat, lng][]
  temp: jsonb("temp"), // integer[] celsius
  moving: jsonb("moving"), // boolean[]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const selectStravaStreamSchema = createSelectSchema(stravaStreams);
export type StravaStream = z.infer<typeof selectStravaStreamSchema>;

// Personal records (best efforts per distance)
export const stravaPersonalRecords = pgTable("strava_personal_records", {
  id: serial("id").primaryKey(),
  athleteStravaId: integer("athlete_strava_id").notNull(),
  activityStravaId: bigint("activity_strava_id", { mode: "number" }).notNull(),
  distanceName: varchar("distance_name", { length: 50 }).notNull(),
  distanceMeters: doublePrecision("distance_meters").notNull(),
  elapsedTime: integer("elapsed_time").notNull(),
  movingTime: integer("moving_time").notNull(),
  achievedAt: timestamp("achieved_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const selectStravaPersonalRecordSchema = createSelectSchema(stravaPersonalRecords);
export type StravaPersonalRecord = z.infer<typeof selectStravaPersonalRecordSchema>;

// Webhook subscription tracking
export const stravaWebhookEvents = pgTable("strava_webhook_events", {
  id: serial("id").primaryKey(),
  objectType: varchar("object_type", { length: 20 }).notNull(),
  objectId: bigint("object_id", { mode: "number" }).notNull(),
  aspectType: varchar("aspect_type", { length: 20 }).notNull(),
  ownerStravaId: integer("owner_strava_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  eventTime: integer("event_time").notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stravaSchema = {
  stravaAthletes,
  stravaActivities,
  stravaStreams,
  stravaPersonalRecords,
  stravaWebhookEvents,
};
