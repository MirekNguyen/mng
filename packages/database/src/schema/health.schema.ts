import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgSchema,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const healthSchema = pgSchema("health");

// A registered iOS device that exports HealthKit data. Authenticates via a
// hashed API key. Each device owns its data and its own sync anchors.
export const healthDevices = healthSchema.table(
  "devices",
  {
    id: serial("id").primaryKey(),
    deviceId: varchar("device_id", { length: 128 }).notNull().unique(), // identifierForVendor
    name: varchar("name", { length: 200 }),
    model: varchar("model", { length: 100 }),
    systemVersion: varchar("system_version", { length: 50 }),
    apiKeyHash: varchar("api_key_hash", { length: 128 }).notNull(),
    lastSeenAt: timestamp("last_seen_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("health_devices_api_key_hash_idx").on(table.apiKeyHash)],
);

export const selectHealthDeviceSchema = createSelectSchema(healthDevices);
export const insertHealthDeviceSchema = createInsertSchema(healthDevices);
export type HealthDevice = z.infer<typeof selectHealthDeviceSchema>;
export type CreateHealthDevice = z.infer<typeof insertHealthDeviceSchema>;

// Raw HealthKit quantity/category samples (steps, heart rate, energy, distance,
// sleep, etc). One row per HKSample, keyed by its HealthKit UUID for idempotency.
export const healthSamples = healthSchema.table(
  "samples",
  {
    id: serial("id").primaryKey(),
    deviceId: varchar("device_id", { length: 128 }).notNull(),
    healthkitUuid: varchar("healthkit_uuid", { length: 64 }).notNull(),
    // e.g. HKQuantityTypeIdentifierStepCount, HKCategoryTypeIdentifierSleepAnalysis
    typeIdentifier: varchar("type_identifier", { length: 100 }).notNull(),
    // "quantity" | "category"
    sampleClass: varchar("sample_class", { length: 20 }).notNull(),
    value: doublePrecision("value"), // numeric value for quantity samples
    unit: varchar("unit", { length: 40 }), // canonical HK unit string
    categoryValue: integer("category_value"), // enum value for category samples
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    sourceName: varchar("source_name", { length: 200 }),
    sourceBundleId: varchar("source_bundle_id", { length: 200 }),
    deviceName: varchar("device_name", { length: 200 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("health_samples_uuid_idx").on(table.healthkitUuid),
    index("health_samples_type_start_idx").on(table.typeIdentifier, table.startDate),
    index("health_samples_device_idx").on(table.deviceId),
  ],
);

export const selectHealthSampleSchema = createSelectSchema(healthSamples);
export const insertHealthSampleSchema = createInsertSchema(healthSamples);
export type HealthSample = z.infer<typeof selectHealthSampleSchema>;
export type CreateHealthSample = z.infer<typeof insertHealthSampleSchema>;

// Workouts (HKWorkout) with the full statistics Apple Fitness surfaces.
export const healthWorkouts = healthSchema.table(
  "workouts",
  {
    id: serial("id").primaryKey(),
    deviceId: varchar("device_id", { length: 128 }).notNull(),
    healthkitUuid: varchar("healthkit_uuid", { length: 64 }).notNull(),
    activityType: integer("activity_type").notNull(), // HKWorkoutActivityType raw value
    activityName: varchar("activity_name", { length: 80 }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    duration: doublePrecision("duration").notNull(), // active seconds
    // Energy
    activeEnergy: doublePrecision("active_energy"), // kcal
    totalEnergy: doublePrecision("total_energy"), // kcal
    // Distance
    distance: doublePrecision("distance"), // meters
    // Heart rate
    avgHeartRate: integer("avg_heart_rate"),
    maxHeartRate: integer("max_heart_rate"),
    minHeartRate: integer("min_heart_rate"),
    // Speed / pace / elevation
    avgSpeed: doublePrecision("avg_speed"), // m/s
    maxSpeed: doublePrecision("max_speed"), // m/s
    elevationAscended: doublePrecision("elevation_ascended"), // meters
    elevationDescended: doublePrecision("elevation_descended"), // meters
    // Cadence / power / other
    avgCadence: doublePrecision("avg_cadence"),
    avgPower: doublePrecision("avg_power"), // watts
    avgMet: doublePrecision("avg_met"),
    stepCount: integer("step_count"),
    swimStrokeCount: integer("swim_stroke_count"),
    // Environment
    temperature: doublePrecision("temperature"), // celsius
    humidity: doublePrecision("humidity"), // 0..1
    indoor: boolean("indoor"),
    // Provenance
    sourceName: varchar("source_name", { length: 200 }),
    deviceName: varchar("device_name", { length: 200 }),
    // Route: [ [lat, lng, altitude, timestampMs], ... ]
    route: jsonb("route"),
    // Splits, HR zones, events, raw metadata
    splits: jsonb("splits"),
    heartRateZones: jsonb("heart_rate_zones"),
    events: jsonb("events"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("health_workouts_uuid_idx").on(table.healthkitUuid),
    index("health_workouts_start_idx").on(table.startDate),
    index("health_workouts_device_idx").on(table.deviceId),
  ],
);

export const selectHealthWorkoutSchema = createSelectSchema(healthWorkouts);
export const insertHealthWorkoutSchema = createInsertSchema(healthWorkouts);
export type HealthWorkout = z.infer<typeof selectHealthWorkoutSchema>;
export type CreateHealthWorkout = z.infer<typeof insertHealthWorkoutSchema>;

// Per-workout time-series (heart rate, pace, power, cadence, etc.). One row per
// workout+metric holding the full sample array as compact JSON columns.
export const healthWorkoutSeries = healthSchema.table(
  "workout_series",
  {
    id: serial("id").primaryKey(),
    workoutUuid: varchar("workout_uuid", { length: 64 }).notNull(),
    metric: varchar("metric", { length: 40 }).notNull(), // heartRate | pace | power | ...
    unit: varchar("unit", { length: 40 }),
    // parallel arrays for compactness: timestampsMs[i] -> values[i]
    timestamps: jsonb("timestamps").notNull(), // number[] epoch ms
    values: jsonb("values").notNull(), // number[]
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("health_workout_series_idx").on(table.workoutUuid, table.metric)],
);

export const selectHealthWorkoutSeriesSchema = createSelectSchema(healthWorkoutSeries);
export type HealthWorkoutSeries = z.infer<typeof selectHealthWorkoutSeriesSchema>;

// Incremental sync anchors: one per device + HealthKit type. The iOS app stores
// its HKQueryAnchor server-side so a reinstall can resume without re-uploading.
export const healthSyncAnchors = healthSchema.table(
  "sync_anchors",
  {
    id: serial("id").primaryKey(),
    deviceId: varchar("device_id", { length: 128 }).notNull(),
    typeIdentifier: varchar("type_identifier", { length: 100 }).notNull(),
    anchor: text("anchor").notNull(), // base64-encoded HKQueryAnchor
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("health_sync_anchors_idx").on(table.deviceId, table.typeIdentifier)],
);

export const selectHealthSyncAnchorSchema = createSelectSchema(healthSyncAnchors);
export type HealthSyncAnchor = z.infer<typeof selectHealthSyncAnchorSchema>;

// Raw ingest audit log — every batch upload, for debugging / replay.
export const healthIngestLog = healthSchema.table("ingest_log", {
  id: serial("id").primaryKey(),
  deviceId: varchar("device_id", { length: 128 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull(), // samples | workouts
  received: integer("received").notNull().default(0),
  inserted: integer("inserted").notNull().default(0),
  eventTime: bigint("event_time", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const selectHealthIngestLogSchema = createSelectSchema(healthIngestLog);
export type HealthIngestLog = z.infer<typeof selectHealthIngestLogSchema>;

export const healthTables = {
  healthDevices,
  healthSamples,
  healthWorkouts,
  healthWorkoutSeries,
  healthSyncAnchors,
  healthIngestLog,
};
