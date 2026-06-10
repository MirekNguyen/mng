import Elysia, { t } from "elysia";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { db } from "@mng/database/db";
import { stravaActivities, stravaPersonalRecords } from "@mng/database/schema/fitness.schema";
import { desc, eq, gte, and } from "drizzle-orm";
import { calculateFitnessData } from "./training-load.calculator";
import { formatDuration, formatPace } from "./format.utils";

const model = deepseek("deepseek-v4-flash");

const buildAthleteContext = async (athleteStravaId: number): Promise<string> => {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [activities, records] = await Promise.all([
    db.query.stravaActivities.findMany({
      where: (a, { and: a2, eq: e, gte: g }) =>
        a2(e(a.athleteStravaId, athleteStravaId), g(a.startDate, since)),
      orderBy: (a, { desc: d }) => [d(a.startDate)],
    }),
    db.query.stravaPersonalRecords.findMany({
      where: (r, { eq: e }) => e(r.athleteStravaId, athleteStravaId),
    }),
  ]);

  const fitnessData = calculateFitnessData(activities, 90);

  // Current week (Mon-aligned)
  const now = new Date();
  const dow = now.getDay();
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(thisMonday.getDate() - daysSinceMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const thisWeek = activities.filter((a) => new Date(a.startDate) >= thisMonday);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastWeek = activities.filter((a) => {
    const d = new Date(a.startDate);
    return d >= lastMonday && d < thisMonday;
  });

  // Deduplicate PRs
  const bestPrs = new Map<number, typeof records[0]>();
  for (const r of records) {
    const existing = bestPrs.get(r.distanceMeters);
    if (!existing || r.elapsedTime < existing.elapsedTime) bestPrs.set(r.distanceMeters, r);
  }

  const runs = activities.filter((a) => a.type === "Run" && a.distance > 1000);
  const recentRuns = runs.slice(0, 20);

  const lines: string[] = [
    "## Athlete Profile",
    `Total activities (90 days): ${activities.length}`,
    `Running activities: ${runs.length}`,
    "",
    "## Current Fitness Status",
    `CTL (Fitness): ${fitnessData.currentCtl} — ${fitnessData.fitnessLevel}`,
    `ATL (Fatigue): ${fitnessData.currentAtl} — ${fitnessData.fatigueLevel}`,
    `TSB (Form): ${fitnessData.currentTsb} — ${fitnessData.formStatus}`,
    "",
    "## This Week (Mon–today)",
    `Activities: ${thisWeek.length}`,
    `Distance: ${(thisWeek.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)} km`,
    `Time: ${formatDuration(thisWeek.reduce((s, a) => s + a.movingTime, 0))}`,
    "",
    "## Last Week",
    `Activities: ${lastWeek.length}`,
    `Distance: ${(lastWeek.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)} km`,
    `Time: ${formatDuration(lastWeek.reduce((s, a) => s + a.movingTime, 0))}`,
    "",
    "## Personal Records",
    ...[...bestPrs.values()]
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .map((r) => `  ${r.distanceName}: ${formatDuration(r.elapsedTime)} (${new Date(r.achievedAt).toLocaleDateString()})`),
    "",
    "## Recent Runs (last 20)",
    ...recentRuns.map((a) => {
      const pace = a.distance > 0 ? formatPace(a.averageSpeed, a.type) : "N/A";
      const hr = a.averageHeartrate > 0 ? `, HR ${Math.round(a.averageHeartrate)}` : "";
      return `  ${new Date(a.startDateLocal).toLocaleDateString()} — ${(a.distance / 1000).toFixed(1)}km, ${formatDuration(a.movingTime)}, ${pace}${hr}`;
    }),
    "",
    "## 6-Week Volume Trend (km/week)",
  ];

  for (let w = 0; w < 6; w++) {
    const wStart = new Date(thisMonday);
    wStart.setDate(wStart.getDate() - w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const dist = activities
      .filter((a) => { const d = new Date(a.startDate); return d >= wStart && d < wEnd; })
      .reduce((s, a) => s + a.distance, 0);
    lines.push(`  Week ${w === 0 ? "(current)" : `-${w}`}: ${(dist / 1000).toFixed(1)} km`);
  }

  return lines.join("\n");
};

const SYSTEM_PROMPT = `You are an expert running coach and sports scientist chatting with a casual urban runner. You have access to their complete training data below.

PERSONALITY:
- Warm, direct, knowledgeable — like a friend who happens to be a coach
- Reference specific numbers from their data when relevant
- Never generic advice — always personalized to THEIR situation
- Casual tone, no jargon unless they ask for it
- Be concise. Short paragraphs. Use bullet points for lists.

CAPABILITIES:
- Analyze their training load, pacing, volume, HR data
- Predict race times based on current fitness
- Recommend training adjustments (recovery, intensity, volume)
- Explain what their metrics mean in plain language
- Discuss nutrition, sleep, recovery strategies
- Analyze photos of food, routes, form, shoes, gear
- Compare weeks, identify trends, flag risks

CONTEXT: This is an urban runner who stops at traffic lights — elapsed/moving time differences are normal city running, not a concern. They train for general fitness with occasional race goals. Training weeks are Monday-Sunday.

FORMAT: Use markdown for structure. Keep responses under 200 words unless they ask for detail.`;

const app = new Elysia({ prefix: "strava/chat" })
  .post(
    "/:athleteStravaId",
    async ({ params, body }) => {
      const athleteStravaId = Number(params.athleteStravaId);
      const messages = body.messages as UIMessage[];

      const athleteContext = await buildAthleteContext(athleteStravaId);

      const result = streamText({
        model,
        system: `${SYSTEM_PROMPT}\n\n---\n\nATHLETE DATA:\n${athleteContext}`,
        messages: await convertToModelMessages(messages),
      });

      return result.toUIMessageStreamResponse();
    },
    {
      params: t.Object({ athleteStravaId: t.String() }),
      body: t.Object({ messages: t.Array(t.Any()) }),
    },
  );

export { app as stravaChatController };
