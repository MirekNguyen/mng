import { logger } from "@mng/logger/logger";
import { db, eq } from "@mng/database/db";
import { stravaActivities, stravaStreams } from "@mng/database/schema/fitness.schema";
import { StravaRepository } from "./strava.repository";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;
const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_AUTH_BASE = "https://www.strava.com/oauth";

const getValidAccessToken = async (athleteStravaId: number): Promise<string> => {
  const athlete = await StravaRepository.getAthleteByStravaId(athleteStravaId);
  if (!athlete) throw new Error(`Athlete ${athleteStravaId} not found`);

  const now = Math.floor(Date.now() / 1000);
  if (athlete.tokenExpiresAt > now + 60) {
    return athlete.accessToken;
  }

  const response = await fetch(`${STRAVA_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: athlete.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) throw new Error(`Token refresh failed: ${response.statusText}`);

  const data = await response.json();
  await StravaRepository.updateAthleteTokens(
    athleteStravaId,
    data.access_token,
    data.refresh_token,
    data.expires_at,
  );

  return data.access_token;
};

const fetchFromStrava = async (athleteStravaId: number, path: string): Promise<Response> => {
  const token = await getValidAccessToken(athleteStravaId);
  return fetch(`${STRAVA_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const StravaSyncService = {
  async syncAllActivities(athleteStravaId: number): Promise<number> {
    let page = 1;
    let totalSynced = 0;
    const perPage = 50;

    logger.info(`Starting full sync for athlete ${athleteStravaId}`);

    while (true) {
      const response = await fetchFromStrava(
        athleteStravaId,
        `/athlete/activities?page=${page}&per_page=${perPage}`,
      );

      if (!response.ok) {
        logger.error(`Failed to fetch activities page ${page}: ${response.statusText}`);
        break;
      }

      const activities = await response.json();
      if (activities.length === 0) break;

      for (const activity of activities) {
        // Store summary first (fast)
        await upsertActivitySummary(athleteStravaId, activity);
        totalSynced++;
      }

      logger.info(`Synced page ${page} (${activities.length} activities)`);
      page++;

      // Rate limit: be conservative
      await delay(1500);
    }

    // Now fetch detailed data + streams for recent activities (last 20)
    logger.info(`Fetching detailed data for recent activities...`);
    const recentActivities = await db.query.stravaActivities.findMany({
      where: eq(stravaActivities.athleteStravaId, athleteStravaId),
      orderBy: (a, { desc }) => [desc(a.startDate)],
      limit: 20,
    });

    for (const activity of recentActivities) {
      await this.syncActivityDetail(athleteStravaId, activity.stravaId);
      await delay(2000); // Strava rate limit: 100 req / 15 min
    }

    await StravaRepository.updateAthleteSyncedAt(athleteStravaId);
    logger.info(`Full sync complete: ${totalSynced} activities for athlete ${athleteStravaId}`);
    return totalSynced;
  },

  async syncSingleActivity(athleteStravaId: number, activityStravaId: number): Promise<void> {
    await this.syncActivityDetail(athleteStravaId, activityStravaId);
    logger.info(`Synced activity ${activityStravaId} for athlete ${athleteStravaId}`);
  },

  async syncActivityDetail(athleteStravaId: number, activityStravaId: number): Promise<void> {
    // Fetch detailed activity
    const response = await fetchFromStrava(athleteStravaId, `/activities/${activityStravaId}?include_all_efforts=true`);
    if (!response.ok) {
      logger.error(`Failed to fetch detail for activity ${activityStravaId}: ${response.statusText}`);
      return;
    }

    const activity = await response.json();

    // Fetch all photos if activity has photos
    if (activity.total_photo_count > 0) {
      await delay(1500);
      const photosResponse = await fetchFromStrava(athleteStravaId, `/activities/${activityStravaId}/photos?size=600`);
      if (photosResponse.ok) {
        activity.all_photos = await photosResponse.json();
      }
    }

    // Fetch kudos
    if (activity.kudos_count > 0) {
      await delay(1500);
      const kudosResponse = await fetchFromStrava(athleteStravaId, `/activities/${activityStravaId}/kudos?per_page=100`);
      if (kudosResponse.ok) {
        activity.kudos_list = await kudosResponse.json();
      }
    }

    // Fetch comments
    if (activity.comment_count > 0) {
      await delay(1500);
      const commentsResponse = await fetchFromStrava(athleteStravaId, `/activities/${activityStravaId}/comments?per_page=100`);
      if (commentsResponse.ok) {
        activity.comments_list = await commentsResponse.json();
      }
    }

    await upsertActivityDetail(athleteStravaId, activity);

    // Extract PRs from best_efforts
    if (activity.best_efforts) {
      await extractPersonalRecords(athleteStravaId, activityStravaId, activity.best_efforts);
    }

    // Fetch streams (separate API call)
    await delay(1500);
    const streamsResponse = await fetchFromStrava(
      athleteStravaId,
      `/activities/${activityStravaId}/streams?keys=time,distance,altitude,heartrate,cadence,watts,velocity_smooth,grade_smooth,latlng,temp,moving&key_by_type=true`,
    );

    if (streamsResponse.ok) {
      const streamsData = await streamsResponse.json();
      await upsertStreams(activityStravaId, streamsData);
    }
  },
};

const upsertActivitySummary = async (athleteStravaId: number, activity: Record<string, unknown>): Promise<void> => {
  const a = activity as Record<string, unknown>;
  await db
    .insert(stravaActivities)
    .values({
      stravaId: a.id as number,
      athleteStravaId,
      name: (a.name as string) ?? "Untitled",
      type: (a.type as string) ?? "Unknown",
      sportType: (a.sport_type as string) ?? (a.type as string) ?? "Unknown",
      distance: (a.distance as number) ?? 0,
      movingTime: (a.moving_time as number) ?? 0,
      elapsedTime: (a.elapsed_time as number) ?? 0,
      totalElevationGain: (a.total_elevation_gain as number) ?? 0,
      startDate: new Date(a.start_date as string),
      startDateLocal: new Date(a.start_date_local as string),
      averageSpeed: (a.average_speed as number) ?? 0,
      maxSpeed: (a.max_speed as number) ?? 0,
      averageHeartrate: (a.average_heartrate as number) ?? null,
      maxHeartrate: (a.max_heartrate as number) ?? null,
      sufferScore: (a.suffer_score as number) ?? null,
      kudosCount: (a.kudos_count as number) ?? 0,
      commentCount: (a.comment_count as number) ?? 0,
      photoCount: (a.total_photo_count as number) ?? 0,
      hasHeartrate: (a.has_heartrate as boolean) ?? false,
      averageCadence: (a.average_cadence as number) ?? null,
      averageWatts: (a.average_watts as number) ?? null,
      kilojoules: (a.kilojoules as number) ?? null,
      mapSummaryPolyline: (a.map as Record<string, unknown>)?.summary_polyline as string ?? null,
      gearId: (a.gear_id as string) ?? null,
    })
    .onConflictDoUpdate({
      target: stravaActivities.stravaId,
      set: {
        name: (a.name as string) ?? "Untitled",
        distance: (a.distance as number) ?? 0,
        movingTime: (a.moving_time as number) ?? 0,
        elapsedTime: (a.elapsed_time as number) ?? 0,
        totalElevationGain: (a.total_elevation_gain as number) ?? 0,
        averageSpeed: (a.average_speed as number) ?? 0,
        maxSpeed: (a.max_speed as number) ?? 0,
        averageHeartrate: (a.average_heartrate as number) ?? null,
        maxHeartrate: (a.max_heartrate as number) ?? null,
        kudosCount: (a.kudos_count as number) ?? 0,
        updatedAt: new Date(),
      },
    });
};

const upsertActivityDetail = async (athleteStravaId: number, a: Record<string, unknown>): Promise<void> => {
  const gear = a.gear as Record<string, unknown> | null;
  const map = a.map as Record<string, unknown> | null;
  const photos = a.photos as Record<string, unknown> | null;
  const allPhotos = a.all_photos as Array<Record<string, unknown>> | null;
  const kudosList = a.kudos_list as Array<Record<string, unknown>> | null;
  const commentsList = a.comments_list as Array<Record<string, unknown>> | null;

  // Merge: store all_photos array alongside primary photo info
  const photosData = allPhotos
    ? { primary: photos?.primary ?? null, count: photos?.count ?? allPhotos.length, all: allPhotos }
    : photos ?? null;

  await db
    .insert(stravaActivities)
    .values({
      stravaId: a.id as number,
      athleteStravaId,
      name: (a.name as string) ?? "Untitled",
      description: (a.description as string) ?? null,
      type: (a.type as string) ?? "Unknown",
      sportType: (a.sport_type as string) ?? (a.type as string) ?? "Unknown",
      distance: (a.distance as number) ?? 0,
      movingTime: (a.moving_time as number) ?? 0,
      elapsedTime: (a.elapsed_time as number) ?? 0,
      totalElevationGain: (a.total_elevation_gain as number) ?? 0,
      elevHigh: (a.elev_high as number) ?? null,
      elevLow: (a.elev_low as number) ?? null,
      startDate: new Date(a.start_date as string),
      startDateLocal: new Date(a.start_date_local as string),
      timezone: (a.timezone as string) ?? null,
      averageSpeed: (a.average_speed as number) ?? 0,
      maxSpeed: (a.max_speed as number) ?? 0,
      averageHeartrate: (a.average_heartrate as number) ?? null,
      maxHeartrate: (a.max_heartrate as number) ?? null,
      sufferScore: (a.suffer_score as number) ?? null,
      kudosCount: (a.kudos_count as number) ?? 0,
      commentCount: (a.comment_count as number) ?? 0,
      photoCount: (a.total_photo_count as number) ?? 0,
      achievementCount: (a.achievement_count as number) ?? 0,
      prCount: (a.pr_count as number) ?? 0,
      hasHeartrate: (a.has_heartrate as boolean) ?? false,
      averageCadence: (a.average_cadence as number) ?? null,
      averageWatts: (a.average_watts as number) ?? null,
      weightedAverageWatts: (a.weighted_average_watts as number) ?? null,
      maxWatts: (a.max_watts as number) ?? null,
      deviceWatts: (a.device_watts as boolean) ?? false,
      kilojoules: (a.kilojoules as number) ?? null,
      calories: (a.calories as number) ?? null,
      averageTemp: (a.average_temp as number) ?? null,
      deviceName: (a.device_name as string) ?? null,
      gearId: (a.gear_id as string) ?? null,
      gearName: gear?.name as string ?? null,
      mapPolyline: map?.polyline as string ?? null,
      mapSummaryPolyline: map?.summary_polyline as string ?? null,
      startLatlng: a.start_latlng ?? null,
      endLatlng: a.end_latlng ?? null,
      photos: photosData,
      kudos: kudosList ?? null,
      comments: commentsList ?? null,
      bestEfforts: (a.best_efforts as unknown) ?? null,
      splitsMetric: (a.splits_metric as unknown) ?? null,
      splitsStandard: (a.splits_standard as unknown) ?? null,
      laps: (a.laps as unknown) ?? null,
      segmentEfforts: (a.segment_efforts as unknown) ?? null,
      isTrainer: (a.trainer as boolean) ?? false,
      isCommute: (a.commute as boolean) ?? false,
      workoutType: (a.workout_type as number) ?? null,
      detailSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: stravaActivities.stravaId,
      set: {
        name: (a.name as string) ?? "Untitled",
        description: (a.description as string) ?? null,
        distance: (a.distance as number) ?? 0,
        movingTime: (a.moving_time as number) ?? 0,
        elapsedTime: (a.elapsed_time as number) ?? 0,
        totalElevationGain: (a.total_elevation_gain as number) ?? 0,
        elevHigh: (a.elev_high as number) ?? null,
        elevLow: (a.elev_low as number) ?? null,
        timezone: (a.timezone as string) ?? null,
        averageSpeed: (a.average_speed as number) ?? 0,
        maxSpeed: (a.max_speed as number) ?? 0,
        averageHeartrate: (a.average_heartrate as number) ?? null,
        maxHeartrate: (a.max_heartrate as number) ?? null,
        sufferScore: (a.suffer_score as number) ?? null,
        kudosCount: (a.kudos_count as number) ?? 0,
        commentCount: (a.comment_count as number) ?? 0,
        photoCount: (a.total_photo_count as number) ?? 0,
        achievementCount: (a.achievement_count as number) ?? 0,
        prCount: (a.pr_count as number) ?? 0,
        hasHeartrate: (a.has_heartrate as boolean) ?? false,
        averageCadence: (a.average_cadence as number) ?? null,
        averageWatts: (a.average_watts as number) ?? null,
        weightedAverageWatts: (a.weighted_average_watts as number) ?? null,
        maxWatts: (a.max_watts as number) ?? null,
        deviceWatts: (a.device_watts as boolean) ?? false,
        kilojoules: (a.kilojoules as number) ?? null,
        calories: (a.calories as number) ?? null,
        averageTemp: (a.average_temp as number) ?? null,
        deviceName: (a.device_name as string) ?? null,
        gearId: (a.gear_id as string) ?? null,
        gearName: gear?.name as string ?? null,
        mapPolyline: map?.polyline as string ?? null,
        mapSummaryPolyline: map?.summary_polyline as string ?? null,
        startLatlng: a.start_latlng ?? null,
        endLatlng: a.end_latlng ?? null,
        photos: photosData,
        kudos: kudosList ?? null,
        comments: commentsList ?? null,
        bestEfforts: (a.best_efforts as unknown) ?? null,
        splitsMetric: (a.splits_metric as unknown) ?? null,
        splitsStandard: (a.splits_standard as unknown) ?? null,
        laps: (a.laps as unknown) ?? null,
        segmentEfforts: (a.segment_efforts as unknown) ?? null,
        isTrainer: (a.trainer as boolean) ?? false,
        isCommute: (a.commute as boolean) ?? false,
        workoutType: (a.workout_type as number) ?? null,
        detailSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });
};

const upsertStreams = async (activityStravaId: number, streamsData: Array<{ type: string; data: unknown[] }>): Promise<void> => {
  const streamMap: Record<string, unknown[]> = {};
  for (const stream of streamsData) {
    streamMap[stream.type] = stream.data;
  }

  await db
    .insert(stravaStreams)
    .values({
      activityStravaId,
      time: streamMap.time ?? null,
      distance: streamMap.distance ?? null,
      altitude: streamMap.altitude ?? null,
      heartrate: streamMap.heartrate ?? null,
      cadence: streamMap.cadence ?? null,
      watts: streamMap.watts ?? null,
      velocitySmooth: streamMap.velocity_smooth ?? null,
      gradeSmooth: streamMap.grade_smooth ?? null,
      latlng: streamMap.latlng ?? null,
      temp: streamMap.temp ?? null,
      moving: streamMap.moving ?? null,
    })
    .onConflictDoUpdate({
      target: stravaStreams.activityStravaId,
      set: {
        time: streamMap.time ?? null,
        distance: streamMap.distance ?? null,
        altitude: streamMap.altitude ?? null,
        heartrate: streamMap.heartrate ?? null,
        cadence: streamMap.cadence ?? null,
        watts: streamMap.watts ?? null,
        velocitySmooth: streamMap.velocity_smooth ?? null,
        gradeSmooth: streamMap.grade_smooth ?? null,
        latlng: streamMap.latlng ?? null,
        temp: streamMap.temp ?? null,
        moving: streamMap.moving ?? null,
      },
    });
};

const PR_DISTANCES: Record<string, number> = {
  "400m": 400,
  "1/2 mile": 805,
  "1K": 1000,
  "1 mile": 1609,
  "2 mile": 3219,
  "5K": 5000,
  "10K": 10000,
  "15K": 15000,
  "10 mile": 16093,
  "Half-Marathon": 21097,
  "Marathon": 42195,
};

const extractPersonalRecords = async (
  athleteStravaId: number,
  activityStravaId: number,
  bestEfforts: Array<{ name: string; distance: number; elapsed_time: number; moving_time: number; start_date: string; pr_rank: number | null }>,
): Promise<void> => {
  for (const effort of bestEfforts) {
    if (effort.pr_rank !== 1) continue;
    const distanceMeters = PR_DISTANCES[effort.name] ?? effort.distance;

    await StravaRepository.upsertPersonalRecord({
      athleteStravaId,
      activityStravaId,
      distanceName: effort.name,
      distanceMeters,
      elapsedTime: effort.elapsed_time,
      movingTime: effort.moving_time,
      achievedAt: new Date(effort.start_date),
    });
  }
};
