import { parseDatabaseError } from "@mng/database/db-error";
import { BadRequestError } from "@mng/http/bad-request.error";
import { ServerError } from "@mng/http/server.error";
import { UnauthorizedError } from "@mng/http/unauthorized.error";
import { logger } from "@mng/logger/logger";
import { cors } from "@elysiajs/cors";
import Elysia from "elysia";

import { deviceController } from "./device/device.controller";
import { ingestController } from "./ingest/ingest.controller";

const PORT = Number(process.env.HEALTH_API_PORT ?? 3005);

const app = new Elysia()
  .use(cors())
  .get("/", () => ({ status: "ok", service: "health-api" }))
  .error({ ServerError, BadRequestError, UnauthorizedError })
  .onError(({ error, code, set }) => {
    if (
      error instanceof ServerError ||
      error instanceof BadRequestError ||
      error instanceof UnauthorizedError
    ) {
      set.status = error.status;
      return { error: error.message };
    }

    const dbError = parseDatabaseError(error);
    if (dbError) {
      logger.error(`Database Error: ${dbError.message} [Code: ${dbError.code}]`);
      set.status = 500;
      return { error: "Internal database error" };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "Invalid request payload" };
    }

    logger.error(`Unhandled error: ${error instanceof Error ? error.message : "unknown"}`);
    set.status = 500;
    return { error: "Internal server error" };
  })
  .use(deviceController)
  .use(ingestController);

app.listen(PORT);

logger.info(`🩺 health-api running at http://${app.server?.hostname}:${app.server?.port}`);
