import Elysia from "elysia";

import { generateApiKey } from "../auth/api-key";
import { DeviceRepository } from "../auth/device.repository";
import { registerDeviceSchema } from "../ingest/ingest.dto";

const app = new Elysia({ prefix: "device" });

/// Registers (or re-registers) a device and returns a fresh API key.
/// The key is only returned here; afterward the device stores it in the Keychain
/// and sends it as `Authorization: Bearer <key>` on every request.
app.post(
  "/register",
  async ({ body }) => {
    const apiKey = generateApiKey();
    const device = await DeviceRepository.register({ ...body, apiKey });
    return {
      deviceId: device.deviceId,
      apiKey,
      registeredAt: device.updatedAt,
    };
  },
  { body: registerDeviceSchema },
);

export { app as deviceController };
