import { parseDatabaseError } from "@mng/database/db-error";
import { ServerError } from "@mng/http/errors/server.error";
import { logger } from "@mng/logger/logger";
import Elysia from "elysia";
import { foodController } from "./food/food.controller";
import { foodEntryController } from "./food-entry/food-entry.controller";
import { propertyController } from "./property/property.controller";

const app = new Elysia()
  .error({ ServerError })
  .onError(({ error }) => {
    const dbError = parseDatabaseError(error);
    if (dbError) {
      logger.error(
        `Database Error: ${dbError.message} [Code: ${dbError.code}]`,
      );
      return new Response("Internal database error");
    }
  })
  .use(propertyController)
  .use(foodController)
  .use(foodEntryController)
  .listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
