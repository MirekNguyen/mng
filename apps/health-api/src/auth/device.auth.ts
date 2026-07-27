import { UnauthorizedError } from "@mng/http/unauthorized.error";
import Elysia from "elysia";

import { DeviceRepository } from "./device.repository";

/// Elysia plugin that authenticates requests via `Authorization: Bearer <key>`
/// and exposes the resolved device on the request context as `device`.
export const deviceAuth = new Elysia({ name: "device-auth" }).resolve(
  { as: "scoped" },
  async ({ headers }) => {
    const header = headers.authorization ?? "";
    const apiKey = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

    if (!apiKey) {
      throw new UnauthorizedError("Missing API key");
    }

    const device = await DeviceRepository.findByApiKey(apiKey);
    if (!device) {
      throw new UnauthorizedError("Invalid API key");
    }

    return { device };
  },
);
