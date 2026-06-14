import Elysia, { t } from "elysia";
import { StravaRepository } from "./strava.repository";
import { calculateFitnessData } from "./training-load.calculator";
import { calculateVolumeTrends } from "./volume-trends.calculator";
import { calculateZoneAnalysis } from "./zone-analysis.calculator";
import { predictRaceTimes, calculateInjuryRisk, generateTrainingInsights } from "./predictions.calculator";
import { analyzeWorkout } from "./workout-analysis.analyzer";
import { generateWeeklyBrief, generatePerformancePrediction } from "./athlete-intelligence.analyzer";
import { db, eq, desc, gte } from "@mng/database/db";
import { stravaActivities } from "@mng/database/schema/fitness.schema";

// In-memory cache for weekly brief (keyed by athlete + latest activity)
const weeklyBriefCache = new Map<string, string>();

const app = new Elysia({ prefix: "strava/analytics" })

  // Fitness / Training Load (CTL/ATL/TSB)
  .get(
    "/fitness/:athleteStravaId",
    async ({ params, query }) => {
      const days = Number(query.days ?? 90);
      const activities = await getActivitiesForDays(Number(params.athleteStravaId), days);
      return calculateFitnessData(activities, days);
    },
    {
      params: t.Object({ athleteStravaId: t.String() }),
      query: t.Object({ days: t.Optional(t.String()) }),
    },
  )

  // Volume Trends (weekly/monthly)
  .get(
    "/volume/:athleteStravaId",
    async ({ params, query }) => {
      const months = Number(query.months ?? 6);
      const since = new Date();
      since.setMonth(since.getMonth() - months);

      const activities = await db.query.stravaActivities.findMany({
        where: (a, { and, eq: e, gte: g }) =>
          and(e(a.athleteStravaId, Number(params.athleteStravaId)), g(a.startDate, since)),
        orderBy: (a, { asc }) => [asc(a.startDate)],
      });

      return calculateVolumeTrends(activities);
    },
    {
      params: t.Object({ athleteStravaId: t.String() }),
      query: t.Object({ months: t.Optional(t.String()) }),
    },
  )

  // Pace & HR Zone Analysis
  .get(
    "/zones/:athleteStravaId",
    async ({ params, query }) => {
      const months = Number(query.months ?? 3);
      const since = new Date();
      since.setMonth(since.getMonth() - months);

      const activities = await db.query.stravaActivities.findMany({
        where: (a, { and, eq: e, gte: g }) =>
          and(e(a.athleteStravaId, Number(params.athleteStravaId)), g(a.startDate, since)),
      });

      const maxHr = Number(query.maxHr ?? 190);
      return calculateZoneAnalysis(activities, maxHr);
    },
    {
      params: t.Object({ athleteStravaId: t.String() }),
      query: t.Object({ months: t.Optional(t.String()), maxHr: t.Optional(t.String()) }),
    },
  )

  // Race Predictions & Injury Risk
  .get(
    "/predictions/:athleteStravaId",
    async ({ params }) => {
      const athleteStravaId = Number(params.athleteStravaId);
      const records = await StravaRepository.getPersonalRecords(athleteStravaId);
      const activities = await getActivitiesForDays(athleteStravaId, 90);

      const racePredictions = predictRaceTimes(records, activities);
      const injuryRisk = calculateInjuryRisk(activities);
      const insights = generateTrainingInsights(activities, injuryRisk);

      return { racePredictions, injuryRisk, insights };
    },
    { params: t.Object({ athleteStravaId: t.String() }) },
  )

  // AI: Workout Analysis (cached)
  .get(
    "/workout-analysis/:athleteStravaId/:activityStravaId",
    async ({ params }) => {
      const athleteStravaId = Number(params.athleteStravaId);
      const activityStravaId = Number(params.activityStravaId);
      const activity = await StravaRepository.getActivityByStravaId(activityStravaId);
      if (!activity) return { error: "Activity not found" };

      // Return cached analysis if available
      if (activity.aiAnalysis) {
        return activity.aiAnalysis;
      }

      const recentActivities = await getActivitiesForDays(athleteStravaId, 7);
      const analysis = await analyzeWorkout(activity, recentActivities);

      // Cache the result
      await db
        .update(stravaActivities)
        .set({ aiAnalysis: analysis })
        .where(eq(stravaActivities.stravaId, activityStravaId));

      return analysis;
    },
    { params: t.Object({ athleteStravaId: t.String(), activityStravaId: t.String() }) },
  )

  // AI: Weekly Training Brief (streaming)
  .get(
    "/weekly-brief/:athleteStravaId",
    async ({ params, query }) => {
      const athleteStravaId = Number(params.athleteStravaId);
      const forceRegenerate = query.force === "true";
      const activities = await getActivitiesForDays(athleteStravaId, 90);

      // Cache key: athlete + latest activity + current training week (Mon-Sun)
      const latestActivity = activities[activities.length - 1];
      const now = new Date();
      const dow = now.getDay();
      const monday = new Date(now);
      monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
      const weekKey = monday.toISOString().slice(0, 10);
      const cacheKey = `${athleteStravaId}:${weekKey}:${latestActivity?.startDate ?? "none"}`;

      if (forceRegenerate) {
        weeklyBriefCache.delete(cacheKey);
      } else if (weeklyBriefCache.has(cacheKey)) {
        return new Response(weeklyBriefCache.get(cacheKey)!, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      const fitnessData = calculateFitnessData(activities, 90);
      const injuryRisk = calculateInjuryRisk(activities);
      const records = await StravaRepository.getPersonalRecords(athleteStravaId);

      const result = generateWeeklyBrief(activities, fitnessData, injuryRisk, records);

      // Collect the stream and cache the full text
      let fullText = "";
      const stream = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          fullText += new TextDecoder().decode(chunk);
          controller.enqueue(chunk);
        },
        flush() {
          weeklyBriefCache.set(cacheKey, fullText);
          // Evict old entries (keep max 10)
          if (weeklyBriefCache.size > 10) {
            const firstKey = weeklyBriefCache.keys().next().value;
            if (firstKey) weeklyBriefCache.delete(firstKey);
          }
        },
      });

      const response = result.toTextStreamResponse();
      const reader = response.body!.getReader();
      const writer = stream.writable.getWriter();

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { await writer.close(); break; }
            await writer.write(value);
          }
        } catch {
          // Stream closed by client, ignore
        }
      })();

      return new Response(stream.readable, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    },
    { params: t.Object({ athleteStravaId: t.String() }), query: t.Object({ force: t.Optional(t.String()) }) },
  )

  // AI: Performance Prediction (streaming)
  .get(
    "/ai-predictions/:athleteStravaId",
    async ({ params }) => {
      const athleteStravaId = Number(params.athleteStravaId);
      const records = await StravaRepository.getPersonalRecords(athleteStravaId);
      const activities = await getActivitiesForDays(athleteStravaId, 90);
      const fitnessData = calculateFitnessData(activities, 90);

      const result = generatePerformancePrediction(records, activities, fitnessData);
      return result.toTextStreamResponse();
    },
    { params: t.Object({ athleteStravaId: t.String() }) },
  );

const getActivitiesForDays = async (athleteStravaId: number, days: number) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db.query.stravaActivities.findMany({
    where: (a, { and, eq: e, gte: g }) =>
      and(e(a.athleteStravaId, athleteStravaId), g(a.startDate, since)),
    orderBy: (a, { asc }) => [asc(a.startDate)],
  });
};

export { app as stravaAnalyticsController };
