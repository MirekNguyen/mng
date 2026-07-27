import { db, and, eq } from "@mng/database/db";
import { healthSyncAnchors, type HealthSyncAnchor } from "@mng/database/schema/health.schema";

export const AnchorRepository = {
  async get(deviceId: string, typeIdentifier: string): Promise<HealthSyncAnchor | undefined> {
    return db.query.healthSyncAnchors.findFirst({
      where: and(
        eq(healthSyncAnchors.deviceId, deviceId),
        eq(healthSyncAnchors.typeIdentifier, typeIdentifier),
      ),
    });
  },

  async list(deviceId: string): Promise<HealthSyncAnchor[]> {
    return db.query.healthSyncAnchors.findMany({
      where: eq(healthSyncAnchors.deviceId, deviceId),
    });
  },

  async upsert(deviceId: string, typeIdentifier: string, anchor: string): Promise<void> {
    await db
      .insert(healthSyncAnchors)
      .values({ deviceId, typeIdentifier, anchor })
      .onConflictDoUpdate({
        target: [healthSyncAnchors.deviceId, healthSyncAnchors.typeIdentifier],
        set: { anchor, updatedAt: new Date() },
      });
  },
};
