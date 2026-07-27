import { db, eq } from "@mng/database/db";
import { healthDevices, type HealthDevice } from "@mng/database/schema/health.schema";

import { hashApiKey } from "./api-key";

export const DeviceRepository = {
  async findByApiKey(apiKey: string): Promise<HealthDevice | undefined> {
    const apiKeyHash = await hashApiKey(apiKey);
    return db.query.healthDevices.findFirst({
      where: eq(healthDevices.apiKeyHash, apiKeyHash),
    });
  },

  async findByDeviceId(deviceId: string): Promise<HealthDevice | undefined> {
    return db.query.healthDevices.findFirst({
      where: eq(healthDevices.deviceId, deviceId),
    });
  },

  async register(input: {
    deviceId: string;
    name?: string;
    model?: string;
    systemVersion?: string;
    apiKey: string;
  }): Promise<HealthDevice> {
    const apiKeyHash = await hashApiKey(input.apiKey);
    const values = {
      deviceId: input.deviceId,
      name: input.name,
      model: input.model,
      systemVersion: input.systemVersion,
      apiKeyHash,
      lastSeenAt: new Date(),
    };

    const [device] = await db
      .insert(healthDevices)
      .values(values)
      .onConflictDoUpdate({
        target: healthDevices.deviceId,
        set: {
          name: values.name,
          model: values.model,
          systemVersion: values.systemVersion,
          apiKeyHash,
          lastSeenAt: values.lastSeenAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!device) {
      throw new Error("Failed to register device");
    }
    return device;
  },

  async touch(deviceId: string): Promise<void> {
    await db
      .update(healthDevices)
      .set({ lastSeenAt: new Date() })
      .where(eq(healthDevices.deviceId, deviceId));
  },
};
