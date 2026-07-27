import { logger } from "@mng/logger/logger";
import Elysia from "elysia";

import { deviceAuth } from "../auth/device.auth";
import { AnchorRepository } from "./anchor.repository";
import { anchorSchema, sampleBatchSchema, workoutBatchSchema } from "./ingest.dto";
import { IngestRepository } from "./ingest.repository";

const app = new Elysia({ prefix: "ingest" }).use(deviceAuth);

/// Batch upload of raw HealthKit samples.
app.post(
  "/samples",
  async ({ body, device }) => {
    const result = await IngestRepository.insertSamples(device.deviceId, body.samples);
    logger.info(
      `[ingest] device=${device.deviceId} samples received=${result.received} inserted=${result.inserted}`,
    );
    return result;
  },
  { body: sampleBatchSchema },
);

/// Batch upload of workouts (with route, series, splits, zones).
app.post(
  "/workouts",
  async ({ body, device }) => {
    const result = await IngestRepository.insertWorkouts(device.deviceId, body.workouts);
    logger.info(
      `[ingest] device=${device.deviceId} workouts received=${result.received} inserted=${result.inserted}`,
    );
    return result;
  },
  { body: workoutBatchSchema },
);

/// Returns all stored sync anchors for the device, so the app can resume
/// incremental queries after a reinstall.
app.get("/anchors", async ({ device }) => {
  const anchors = await AnchorRepository.list(device.deviceId);
  return anchors.map((row) => ({ typeIdentifier: row.typeIdentifier, anchor: row.anchor }));
});

/// Persists an updated HKQueryAnchor for a HealthKit type.
app.put(
  "/anchors",
  async ({ body, device }) => {
    await AnchorRepository.upsert(device.deviceId, body.typeIdentifier, body.anchor);
    return { ok: true };
  },
  { body: anchorSchema },
);

export { app as ingestController };
