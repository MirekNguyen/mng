import { db, eq } from "@mng/database/db";
import {
  stravaAthletes,
  stravaActivities,
  stravaStreams,
  stravaPersonalRecords,
  stravaWebhookEvents,
} from "@mng/database/schema/fitness.schema";
import type {
  CreateStravaAthlete,
  StravaAthlete,
  StravaActivity,
  StravaStream,
} from "@mng/database/schema/fitness.schema";

export const StravaRepository = {
  async upsertAthlete(data: Omit<CreateStravaAthlete, "id" | "createdAt" | "updatedAt">): Promise<StravaAthlete> {
    const [result] = await db
      .insert(stravaAthletes)
      .values(data)
      .onConflictDoUpdate({
        target: stravaAthletes.stravaId,
        set: {
          firstName: data.firstName,
          lastName: data.lastName,
          profileImageUrl: data.profileImageUrl,
          city: data.city,
          country: data.country,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiresAt: data.tokenExpiresAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  },

  async getAthleteByStravaId(stravaId: number): Promise<StravaAthlete | undefined> {
    return db.query.stravaAthletes.findFirst({
      where: eq(stravaAthletes.stravaId, stravaId),
    });
  },

  async updateAthleteTokens(stravaId: number, accessToken: string, refreshToken: string, expiresAt: number): Promise<void> {
    await db
      .update(stravaAthletes)
      .set({ accessToken, refreshToken, tokenExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(stravaAthletes.stravaId, stravaId));
  },

  async updateAthleteSyncedAt(stravaId: number): Promise<void> {
    await db
      .update(stravaAthletes)
      .set({ syncedAt: new Date(), updatedAt: new Date() })
      .where(eq(stravaAthletes.stravaId, stravaId));
  },

  async upsertActivity(data: Omit<StravaActivity, "id" | "createdAt" | "updatedAt">): Promise<void> {
    await db
      .insert(stravaActivities)
      .values(data)
      .onConflictDoUpdate({
        target: stravaActivities.stravaId,
        set: {
          name: data.name,
          type: data.type,
          sportType: data.sportType,
          distance: data.distance,
          movingTime: data.movingTime,
          elapsedTime: data.elapsedTime,
          totalElevationGain: data.totalElevationGain,
          averageSpeed: data.averageSpeed,
          maxSpeed: data.maxSpeed,
          averageHeartrate: data.averageHeartrate,
          maxHeartrate: data.maxHeartrate,
          sufferScore: data.sufferScore,
          kudosCount: data.kudosCount,
          hasHeartrate: data.hasHeartrate,
          averageCadence: data.averageCadence,
          averageWatts: data.averageWatts,
          kilojoules: data.kilojoules,
          calories: data.calories,
          mapPolyline: data.mapPolyline,
          bestEfforts: data.bestEfforts,
          splits: data.splits,
          laps: data.laps,
          updatedAt: new Date(),
        },
      });
  },

  async deleteActivity(stravaId: number): Promise<void> {
    await db.delete(stravaActivities).where(eq(stravaActivities.stravaId, stravaId));
  },

  async getActivities(athleteStravaId: number, limit = 50, offset = 0): Promise<StravaActivity[]> {
    return db.query.stravaActivities.findMany({
      where: eq(stravaActivities.athleteStravaId, athleteStravaId),
      orderBy: (a, { desc }) => [desc(a.startDate)],
      limit,
      offset,
    });
  },

  async getActivityByStravaId(stravaId: number): Promise<StravaActivity | undefined> {
    return db.query.stravaActivities.findFirst({
      where: eq(stravaActivities.stravaId, stravaId),
    });
  },

  async getStreams(activityStravaId: number): Promise<StravaStream | undefined> {
    return db.query.stravaStreams.findFirst({
      where: eq(stravaStreams.activityStravaId, activityStravaId),
    });
  },

  async getPersonalRecords(athleteStravaId: number) {
    return db.query.stravaPersonalRecords.findMany({
      where: eq(stravaPersonalRecords.athleteStravaId, athleteStravaId),
      orderBy: (r, { asc }) => [asc(r.distanceName), asc(r.elapsedTime)],
    });
  },

  async upsertPersonalRecord(data: {
    athleteStravaId: number;
    activityStravaId: number;
    distanceName: string;
    distanceMeters: number;
    elapsedTime: number;
    movingTime: number;
    achievedAt: Date;
  }): Promise<void> {
    await db.insert(stravaPersonalRecords).values(data);
  },

  async insertWebhookEvent(data: {
    objectType: string;
    objectId: number;
    aspectType: string;
    ownerStravaId: number;
    subscriptionId: number;
    eventTime: number;
  }): Promise<number> {
    const [result] = await db.insert(stravaWebhookEvents).values(data).returning({ id: stravaWebhookEvents.id });
    return result.id;
  },

  async markWebhookProcessed(eventId: number): Promise<void> {
    await db
      .update(stravaWebhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(stravaWebhookEvents.id, eventId));
  },
};
