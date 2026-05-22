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
import { stravaController } from "./strava/strava.controller";
import { stravaAnalyticsController } from "./strava/strava-analytics.controller";
import { stravaChatController } from "./strava/strava-chat.controller";
import { ServerError } from "@mng/http/server.error";
import { auth } from "./auth";
import { db, eq, and } from "@mng/database/db";
import { account } from "@mng/database/schema/auth.schema";

const TRUSTED_ORIGINS = (process.env.TRUSTED_ORIGINS ?? process.env.APP_URL ?? "http://localhost:3001")
  .split(",")
  .map((u) => u.trim());

const app = new Elysia()
  .use(cors({
    origin: TRUSTED_ORIGINS,
    credentials: true,
  }))
  // Catch better-auth error redirects and forward back to the originating app.
  // We read the `auth_origin` cookie set by the client before starting OAuth.
  // Falls back to first trusted origin if cookie is missing.
  .get("/", ({ query, set, cookie }) => {
    const error = (query as Record<string, string>).error;
    if (error) {
      const origin = cookie.auth_origin?.value;
      const baseUrl = origin && TRUSTED_ORIGINS.includes(origin) ? origin : TRUSTED_ORIGINS[0];
      set.redirect = `${baseUrl}/login?error=${error}`;
      cookie.auth_origin?.remove();
      return;
    }
    return { status: "ok" };
  })
  .mount(auth.handler)
  // Returns current user + strava connection status
  .get("/api/me", async ({ headers }) => {
    const session = await auth.api.getSession({ headers: new Headers(headers as Record<string, string>) });
    if (!session?.user) return { user: null, stravaConnected: false, stravaAthleteId: null };

    const stravaAccount = await db.select()
      .from(account)
      .where(and(eq(account.userId, session.user.id), eq(account.providerId, "strava")))
      .limit(1);

    const stravaAthleteId = stravaAccount.length > 0 ? Number(stravaAccount[0].accountId) : null;

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
      stravaConnected: stravaAthleteId !== null,
      stravaAthleteId,
    };
  })
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
  .use(stravaController)
  .use(stravaAnalyticsController)
  .use(stravaChatController)
  .listen(3000);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
