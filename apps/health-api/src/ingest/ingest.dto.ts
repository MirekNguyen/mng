import { z } from "zod";

/// A raw HealthKit quantity/category sample as sent by the iOS app.
export const sampleInputSchema = z.object({
  healthkitUuid: z.string().min(1).max(64),
  typeIdentifier: z.string().min(1).max(100),
  sampleClass: z.enum(["quantity", "category"]),
  value: z.number().nullable().optional(),
  unit: z.string().max(40).nullable().optional(),
  categoryValue: z.number().int().nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  sourceName: z.string().max(200).nullable().optional(),
  sourceBundleId: z.string().max(200).nullable().optional(),
  deviceName: z.string().max(200).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type SampleInput = z.infer<typeof sampleInputSchema>;

/// A per-workout time-series metric (parallel timestamp/value arrays).
export const workoutSeriesInputSchema = z.object({
  metric: z.string().min(1).max(40),
  unit: z.string().max(40).nullable().optional(),
  timestamps: z.array(z.number()),
  values: z.array(z.number()),
});

export type WorkoutSeriesInput = z.infer<typeof workoutSeriesInputSchema>;

/// A route point: [latitude, longitude, altitude, epochMs].
const routePointSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

/// A full workout with statistics, route, series, splits, zones and events.
export const workoutInputSchema = z.object({
  healthkitUuid: z.string().min(1).max(64),
  activityType: z.number().int(),
  activityName: z.string().max(80).nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  duration: z.number(),
  activeEnergy: z.number().nullable().optional(),
  totalEnergy: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  avgHeartRate: z.number().int().nullable().optional(),
  maxHeartRate: z.number().int().nullable().optional(),
  minHeartRate: z.number().int().nullable().optional(),
  avgSpeed: z.number().nullable().optional(),
  maxSpeed: z.number().nullable().optional(),
  elevationAscended: z.number().nullable().optional(),
  elevationDescended: z.number().nullable().optional(),
  avgCadence: z.number().nullable().optional(),
  avgPower: z.number().nullable().optional(),
  avgMet: z.number().nullable().optional(),
  stepCount: z.number().int().nullable().optional(),
  swimStrokeCount: z.number().int().nullable().optional(),
  temperature: z.number().nullable().optional(),
  humidity: z.number().nullable().optional(),
  indoor: z.boolean().nullable().optional(),
  sourceName: z.string().max(200).nullable().optional(),
  deviceName: z.string().max(200).nullable().optional(),
  route: z.array(routePointSchema).nullable().optional(),
  splits: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  heartRateZones: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  events: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  series: z.array(workoutSeriesInputSchema).optional(),
});

export type WorkoutInput = z.infer<typeof workoutInputSchema>;

/// Batch payloads.
export const sampleBatchSchema = z.object({
  eventTime: z.number().optional(),
  samples: z.array(sampleInputSchema).max(10000),
});

export const workoutBatchSchema = z.object({
  eventTime: z.number().optional(),
  workouts: z.array(workoutInputSchema).max(500),
});

/// Device registration.
export const registerDeviceSchema = z.object({
  deviceId: z.string().min(1).max(128),
  name: z.string().max(200).optional(),
  model: z.string().max(100).optional(),
  systemVersion: z.string().max(50).optional(),
});

/// Sync anchor upsert.
export const anchorSchema = z.object({
  typeIdentifier: z.string().min(1).max(100),
  anchor: z.string().min(1),
});
