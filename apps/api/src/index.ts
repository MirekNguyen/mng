import { parseDatabaseError } from "@mng/database/db-error";
import { logger } from "@mng/logger/logger";
import { cors } from "@elysiajs/cors";
import Elysia from "elysia";
import { emailController } from "./email/email.controller";
import { foodController } from "./food/food.controller";
import { foodEntryController } from "./food-entry/food-entry.controller";
import { propertyController } from "./property/property.controller";
import { statsController } from "./stats/stats.controller";
import { userController } from "./user/user.controller";
import { ServerError } from "@mng/http/server.error";

const app = new Elysia()
  .use(cors())
  .error({ ServerError })
  .onError(({ error }) => {
    const dbError = parseDatabaseError(error);
    if (dbError) {
      logger.error(`Database Error: ${dbError.message} [Code: ${dbError.code}]`);
      return new Response("Internal database error");
    }
  })
  .use(propertyController)
  .use(foodController)
  .use(foodEntryController)
  .use(statsController)
  .use(userController)
  .use(emailController)
  .listen(3000);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
