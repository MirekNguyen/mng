import Elysia, { t } from "elysia";
import { logger } from "@mng/logger/logger";
import { StravaRepository } from "./strava.repository";
import { StravaSyncService } from "./strava.sync";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;
const STRAVA_VERIFY_TOKEN = process.env.STRAVA_VERIFY_TOKEN ?? "mng-strava-verify";

const app = new Elysia({ prefix: "strava" })

  // OAuth callback — exchange code for tokens and store athlete
  .post(
    "/auth",
    async ({ body }) => {
      const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code: body.code,
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        return { error: "Token exchange failed" };
      }

      const data = await response.json();
      const athlete = await StravaRepository.upsertAthlete({
        stravaId: data.athlete.id,
        firstName: data.athlete.firstname,
        lastName: data.athlete.lastname,
        profileImageUrl: data.athlete.profile,
        city: data.athlete.city,
        country: data.athlete.country,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiresAt: data.expires_at,
      });

      return { athlete, needsSync: !athlete.syncedAt };
    },
    { body: t.Object({ code: t.String() }) },
  )

  // Trigger full historical sync
  .post(
    "/sync/:athleteStravaId",
    async ({ params }) => {
      const count = await StravaSyncService.syncAllActivities(Number(params.athleteStravaId));
      return { synced: count };
    },
    { params: t.Object({ athleteStravaId: t.String() }) },
  )

  // Lightweight refresh: fetch last 20 activities and detail any new ones
  .post(
    "/sync-recent/:athleteStravaId",
    async ({ params }) => {
      const count = await StravaSyncService.syncRecent(Number(params.athleteStravaId));
      return { synced: count };
    },
    { params: t.Object({ athleteStravaId: t.String() }) },
  )

  // Get activities from local DB
  .get(
    "/activities/:athleteStravaId",
    async ({ params, query }) => {
      const activities = await StravaRepository.getActivities(
        Number(params.athleteStravaId),
        Number(query.limit ?? 50),
        Number(query.offset ?? 0),
      );
      return { activities };
    },
    {
      params: t.Object({ athleteStravaId: t.String() }),
      query: t.Object({ limit: t.Optional(t.String()), offset: t.Optional(t.String()) }),
    },
  )

  // Get single activity (fetches detail on-demand if not yet synced)
  .get(
    "/activities/:athleteStravaId/:activityStravaId",
    async ({ params }) => {
      const athleteStravaId = Number(params.athleteStravaId);
      const activityStravaId = Number(params.activityStravaId);
      let activity = await StravaRepository.getActivityByStravaId(activityStravaId);

      // If activity exists but detail hasn't been fetched yet, fetch it now
      if (activity && !activity.detailSyncedAt) {
        try {
          await StravaSyncService.syncActivityDetail(athleteStravaId, activityStravaId);
          activity = await StravaRepository.getActivityByStravaId(activityStravaId);
        } catch (err) {
          logger.error(`On-demand detail sync failed for ${activityStravaId}: ${err}`);
        }
      }

      return { activity: activity ?? null };
    },
    { params: t.Object({ athleteStravaId: t.String(), activityStravaId: t.String() }) },
  )

  // Get activity streams
  .get(
    "/streams/:activityStravaId",
    async ({ params }) => {
      const streams = await StravaRepository.getStreams(Number(params.activityStravaId));
      return { streams: streams ?? null };
    },
    { params: t.Object({ activityStravaId: t.String() }) },
  )

  // Get personal records
  .get(
    "/records/:athleteStravaId",
    async ({ params }) => {
      const records = await StravaRepository.getPersonalRecords(Number(params.athleteStravaId));
      return { records };
    },
    { params: t.Object({ athleteStravaId: t.String() }) },
  )

  // Get athlete profile
  .get(
    "/athlete/:athleteStravaId",
    async ({ params }) => {
      const athlete = await StravaRepository.getAthleteByStravaId(Number(params.athleteStravaId));
      return { athlete: athlete ?? null };
    },
    { params: t.Object({ athleteStravaId: t.String() }) },
  )

  // Webhook verification (Strava sends GET to verify)
  .get(
    "/webhook",
    ({ query }) => {
      if (query["hub.verify_token"] === STRAVA_VERIFY_TOKEN) {
        logger.info("Strava webhook verified");
        return { "hub.challenge": query["hub.challenge"] };
      }
      return new Response("Forbidden", { status: 403 });
    },
    {
      query: t.Object({
        "hub.mode": t.String(),
        "hub.verify_token": t.String(),
        "hub.challenge": t.String(),
      }),
    },
  )

  // Webhook event handler (Strava sends POST on activity create/update/delete)
  .post(
    "/webhook",
    async ({ body }) => {
      const eventId = await StravaRepository.insertWebhookEvent({
        objectType: body.object_type,
        objectId: body.object_id,
        aspectType: body.aspect_type,
        ownerStravaId: body.owner_id,
        subscriptionId: body.subscription_id,
        eventTime: body.event_time,
      });

      // Process async — don't block the response
      processWebhookEvent(eventId, body).catch((err) => {
        logger.error(`Webhook processing failed for event ${eventId}: ${err}`);
      });

      return "EVENT_RECEIVED";
    },
    {
      body: t.Object({
        object_type: t.String(),
        object_id: t.Number(),
        aspect_type: t.String(),
        owner_id: t.Number(),
        subscription_id: t.Number(),
        event_time: t.Number(),
        updates: t.Optional(t.Record(t.String(), t.Any())),
      }),
    },
  );

const processWebhookEvent = async (
  eventId: number,
  event: { object_type: string; object_id: number; aspect_type: string; owner_id: number },
): Promise<void> => {
  if (event.object_type === "activity") {
    if (event.aspect_type === "create" || event.aspect_type === "update") {
      await StravaSyncService.syncSingleActivity(event.owner_id, event.object_id);
    } else if (event.aspect_type === "delete") {
      await StravaRepository.deleteActivity(event.object_id);
    }
  }
  await StravaRepository.markWebhookProcessed(eventId);
};

export { app as stravaController };
