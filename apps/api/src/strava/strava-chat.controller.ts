import Elysia, { t } from "elysia";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { db } from "@mng/database/db";
import { stravaActivities, stravaPersonalRecords, stravaAthletes } from "@mng/database/schema/fitness.schema";
import { desc, eq, gte, and } from "drizzle-orm";
import { calculateFitnessData } from "./training-load.calculator";
import { formatDuration, formatPace } from "./format.utils";

const model = deepseek("deepseek-v4-flash");

const getMondayOf = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
};

const deriveMaxHr = (activities: { maxHeartrate?: number | null }[], storedMaxHr?: number | null): number => {
  if (storedMaxHr && storedMaxHr > 100 && storedMaxHr < 250) return storedMaxHr;
  const maxes = activities
    .map((a) => a.maxHeartrate ?? 0)
    .filter((hr) => hr > 100 && hr < 230);
  return maxes.length > 0 ? Math.max(...maxes) : 190;
};

const formatHrZones = (maxHr: number): string => {
  const zones = [
    { name: "Z1 Recovery", minPct: 0, maxPct: 0.6 },
    { name: "Z2 Aerobic", minPct: 0.6, maxPct: 0.7 },
    { name: "Z3 Tempo", minPct: 0.7, maxPct: 0.8 },
    { name: "Z4 Threshold", minPct: 0.8, maxPct: 0.9 },
    { name: "Z5 VO2max", minPct: 0.9, maxPct: 1.01 },
  ];
  return zones
    .map((z) => `  ${z.name}: ${Math.round(z.minPct * maxHr)}–${Math.round(z.maxPct * maxHr)} bpm`)
    .join("\n");
};

const buildAthleteContext = async (athleteStravaId: number): Promise<string> => {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [activities, records, athleteProfile] = await Promise.all([
    db.query.stravaActivities.findMany({
      where: (a, { and: a2, eq: e, gte: g }) =>
        a2(e(a.athleteStravaId, athleteStravaId), g(a.startDate, since)),
      orderBy: (a, { asc }) => [asc(a.startDate)],
    }),
    db.query.stravaPersonalRecords.findMany({
      where: (r, { eq: e }) => e(r.athleteStravaId, athleteStravaId),
    }),
    db.query.stravaAthletes.findFirst({
      where: (a, { eq: e }) => e(a.stravaId, athleteStravaId),
    }),
  ]);

  const fitnessData = calculateFitnessData(activities, 90);
  const maxHr = deriveMaxHr(activities, athleteProfile?.maxHr);

  const now = new Date();
  const thisMonday = getMondayOf(now);
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  // Use startDateLocal for accurate local-time week splits
  const thisWeek = activities.filter((a) => {
    const d = new Date(a.startDateLocal);
    return d >= thisMonday && d < nextMonday;
  });
  const lastWeek = activities.filter((a) => {
    const d = new Date(a.startDateLocal);
    return d >= lastMonday && d < thisMonday;
  });

  // Deduplicate PRs
  const bestPrs = new Map<number, typeof records[0]>();
  for (const r of records) {
    const existing = bestPrs.get(r.distanceMeters);
    if (!existing || r.elapsedTime < existing.elapsedTime) bestPrs.set(r.distanceMeters, r);
  }

  const runs = activities.filter((a) => a.type === "Run" && a.distance > 1000);
  const recentRuns = [...runs].reverse().slice(0, 20);

  const lines: string[] = [
    "## Athlete Profile",
    `Max HR (derived): ${maxHr} bpm`,
    "Heart Rate Zones:",
    formatHrZones(maxHr),
    "",
    `Total activities (90 days): ${activities.length}`,
    `Running activities: ${runs.length}`,
    "",
    "## Current Fitness Status",
    `CTL (Fitness): ${fitnessData.currentCtl} — ${fitnessData.fitnessLevel}`,
    `ATL (Fatigue): ${fitnessData.currentAtl} — ${fitnessData.fatigueLevel}`,
    `TSB (Form): ${fitnessData.currentTsb} — ${fitnessData.formStatus}`,
    "",
    `## This Week (Mon–today, ${thisMonday.toLocaleDateString("en", { month: "short", day: "numeric" })})`,
    `Activities: ${thisWeek.length}`,
    `Distance: ${(thisWeek.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)} km`,
    `Time: ${formatDuration(thisWeek.reduce((s, a) => s + a.movingTime, 0))}`,
    "",
    `## Last Week (${lastMonday.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${thisMonday.toLocaleDateString("en", { month: "short", day: "numeric" })})`,
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
      const hr = (a.averageHeartrate ?? 0) > 0 ? `, HR ${Math.round(a.averageHeartrate!)}` : "";
      return `  ${new Date(a.startDateLocal).toLocaleDateString()} — ${(a.distance / 1000).toFixed(1)} km, ${formatDuration(a.movingTime)}, ${pace}${hr}`;
    }),
    "",
    "## 12-Week Volume History (Mon-aligned, local time):",
  ];

  for (let w = 0; w < 12; w++) {
    const wStart = new Date(thisMonday);
    wStart.setDate(wStart.getDate() - w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const weekRuns = runs.filter((a) => {
      const d = new Date(a.startDateLocal);
      return d >= wStart && d < wEnd;
    });
    const dist = weekRuns.reduce((s, a) => s + a.distance, 0) / 1000;
    const time = weekRuns.reduce((s, a) => s + a.movingTime, 0);
    const avgPace = dist > 0 ? (time / (dist * 1000)) * 1000 : 0;
    const paceStr = avgPace > 0
      ? `${Math.floor(avgPace / 60)}:${Math.round(avgPace % 60).toString().padStart(2, "0")}/km`
      : "—";
    const label = w === 0 ? "This week (so far)" : w === 1 ? "Last week" : `${w}w ago`;
    const dateLabel = wStart.toLocaleDateString("en", { month: "short", day: "numeric" });
    lines.push(`  ${label} (${dateLabel}): ${weekRuns.length} runs, ${dist.toFixed(1)} km, ${paceStr}`);
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
- Use their HR zones (derived from max HR) to categorize effort levels in sessions
- Predict race times based on current fitness
- Recommend training adjustments (recovery, intensity, volume)
- Explain what their metrics mean in plain language
- Discuss nutrition, sleep, recovery strategies
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
