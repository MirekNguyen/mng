import { db } from "@mng/database/db";
import {
  healthIngestLog,
  healthSamples,
  healthWorkouts,
  healthWorkoutSeries,
} from "@mng/database/schema/health.schema";

import type { SampleInput, WorkoutInput } from "./ingest.dto";

type IngestResult = { received: number; inserted: number };

const CHUNK_SIZE = 1000;

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export const IngestRepository = {
  /// Idempotently inserts raw samples; existing UUIDs are ignored.
  async insertSamples(deviceId: string, samples: SampleInput[]): Promise<IngestResult> {
    if (samples.length === 0) return { received: 0, inserted: 0 };

    const rows = samples.map((sample) => ({
      deviceId,
      healthkitUuid: sample.healthkitUuid,
      typeIdentifier: sample.typeIdentifier,
      sampleClass: sample.sampleClass,
      value: sample.value ?? null,
      unit: sample.unit ?? null,
      categoryValue: sample.categoryValue ?? null,
      startDate: sample.startDate,
      endDate: sample.endDate,
      sourceName: sample.sourceName ?? null,
      sourceBundleId: sample.sourceBundleId ?? null,
      deviceName: sample.deviceName ?? null,
      metadata: sample.metadata ?? null,
    }));

    let inserted = 0;
    for (const batch of chunk(rows, CHUNK_SIZE)) {
      const result = await db
        .insert(healthSamples)
        .values(batch)
        .onConflictDoNothing({ target: healthSamples.healthkitUuid })
        .returning({ id: healthSamples.id });
      inserted += result.length;
    }

    await IngestRepository.log(deviceId, "samples", samples.length, inserted);
    return { received: samples.length, inserted };
  },

  /// Upserts workouts (re-synced workouts update in place) and their series.
  async insertWorkouts(deviceId: string, workouts: WorkoutInput[]): Promise<IngestResult> {
    if (workouts.length === 0) return { received: 0, inserted: 0 };

    let inserted = 0;
    for (const workout of workouts) {
      const values = {
        deviceId,
        healthkitUuid: workout.healthkitUuid,
        activityType: workout.activityType,
        activityName: workout.activityName ?? null,
        startDate: workout.startDate,
        endDate: workout.endDate,
        duration: workout.duration,
        activeEnergy: workout.activeEnergy ?? null,
        totalEnergy: workout.totalEnergy ?? null,
        distance: workout.distance ?? null,
        avgHeartRate: workout.avgHeartRate ?? null,
        maxHeartRate: workout.maxHeartRate ?? null,
        minHeartRate: workout.minHeartRate ?? null,
        avgSpeed: workout.avgSpeed ?? null,
        maxSpeed: workout.maxSpeed ?? null,
        elevationAscended: workout.elevationAscended ?? null,
        elevationDescended: workout.elevationDescended ?? null,
        avgCadence: workout.avgCadence ?? null,
        avgPower: workout.avgPower ?? null,
        avgMet: workout.avgMet ?? null,
        stepCount: workout.stepCount ?? null,
        swimStrokeCount: workout.swimStrokeCount ?? null,
        temperature: workout.temperature ?? null,
        humidity: workout.humidity ?? null,
        indoor: workout.indoor ?? null,
        sourceName: workout.sourceName ?? null,
        deviceName: workout.deviceName ?? null,
        route: workout.route ?? null,
        splits: workout.splits ?? null,
        heartRateZones: workout.heartRateZones ?? null,
        events: workout.events ?? null,
        metadata: workout.metadata ?? null,
      };

      const result = await db
        .insert(healthWorkouts)
        .values(values)
        .onConflictDoUpdate({
          target: healthWorkouts.healthkitUuid,
          set: { ...values, updatedAt: new Date() },
        })
        .returning({ id: healthWorkouts.id });

      if (result.length > 0) inserted += 1;

      await IngestRepository.insertWorkoutSeries(workout);
    }

    await IngestRepository.log(deviceId, "workouts", workouts.length, inserted);
    return { received: workouts.length, inserted };
  },

  async insertWorkoutSeries(workout: WorkoutInput): Promise<void> {
    const series = workout.series ?? [];
    if (series.length === 0) return;

    for (const entry of series) {
      const row = {
        workoutUuid: workout.healthkitUuid,
        metric: entry.metric,
        unit: entry.unit ?? null,
        timestamps: entry.timestamps,
        values: entry.values,
      };

      await db
        .insert(healthWorkoutSeries)
        .values(row)
        .onConflictDoUpdate({
          target: [healthWorkoutSeries.workoutUuid, healthWorkoutSeries.metric],
          set: {
            timestamps: row.timestamps,
            values: row.values,
            unit: row.unit,
          },
        });
    }
  },

  async log(
    deviceId: string,
    kind: "samples" | "workouts",
    received: number,
    inserted: number,
    eventTime?: number,
  ): Promise<void> {
    await db.insert(healthIngestLog).values({
      deviceId,
      kind,
      received,
      inserted,
      eventTime: eventTime ?? null,
    });
  },
};
