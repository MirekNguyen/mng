import { streamText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import type { StravaActivity, StravaPersonalRecord } from "@mng/database/schema/fitness.schema";
import { formatDuration, formatPace } from "./format.utils";
import type { FitnessData } from "./training-load.calculator";
import type { InjuryRisk } from "./predictions.calculator";

const model = deepseek("deepseek-v4-flash");

// Monday 00:00:00 in local time of the activity data
const getMondayOf = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
};

// Derive max HR: prefer athlete's stored value, fall back to best recorded activity value
const resolveMaxHr = (activities: StravaActivity[], storedMaxHr: number | null | undefined): number => {
  if (storedMaxHr && storedMaxHr > 100 && storedMaxHr < 250) return storedMaxHr;
  const maxes = activities
    .map((a) => a.maxHeartrate ?? 0)
    .filter((hr) => hr > 100 && hr < 230);
  return maxes.length > 0 ? Math.max(...maxes) : 190;
};

// Format HR zones from a maxHr value
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

// Compact weekly summary for historical weeks
const buildWeekSummary = (
  weekStart: Date,
  weekEnd: Date,
  activities: StravaActivity[],
  label: string,
): string => {
  const weekActs = activities.filter((a) => {
    const d = new Date(a.startDateLocal);
    return d >= weekStart && d < weekEnd;
  });
  const runs = weekActs.filter((a) => a.type === "Run");
  const dist = runs.reduce((s, a) => s + a.distance, 0) / 1000;
  const time = runs.reduce((s, a) => s + a.movingTime, 0);
  const avgPace = dist > 0 ? (time / (dist * 1000)) * 1000 : 0;
  const hrRuns = runs.filter((a) => (a.averageHeartrate ?? 0) > 0);
  const avgHr = hrRuns.length > 0
    ? Math.round(hrRuns.reduce((s, a) => s + (a.averageHeartrate ?? 0), 0) / hrRuns.length)
    : null;
  const paceStr = avgPace > 0
    ? `${Math.floor(avgPace / 60)}:${Math.round(avgPace % 60).toString().padStart(2, "0")}/km`
    : "—";
  const hrStr = avgHr ? `, avg HR ${avgHr}` : "";
  const dateLabel = weekStart.toLocaleDateString("en", { month: "short", day: "numeric" });
  return `  ${label} (${dateLabel}): ${runs.length} runs, ${dist.toFixed(1)} km, ${formatDuration(time)}, ${paceStr}${hrStr}`;
};

export const generateWeeklyBrief = (
  activities: StravaActivity[],
  fitnessData: FitnessData,
  injuryRisk: InjuryRisk,
  records: StravaPersonalRecord[],
  athleteMaxHr?: number | null,
) => {
  const context = buildWeeklyContext(activities, fitnessData, injuryRisk, records, athleteMaxHr);

  return streamText({
    model,
    messages: [
      {
        role: "system",
        content: `You are an expert endurance coach reviewing a casual runner's CURRENT training week (Monday to today). This athlete is a health-conscious urban runner — they stop at traffic lights, run in the city, and train for general fitness with occasional race goals.

IMPORTANT: "This week" means Monday through today ONLY. "Last week" is the previous Monday-Sunday. Previous weeks are clearly labeled. Do NOT mix them up. The data is pre-split for you.

Your analysis must be data-driven: reference actual numbers, paces, HR values, and trends from the provided data. Never give generic advice.

Structure your response EXACTLY as:

## Week Summary
2-3 sentences covering what's happened THIS WEEK so far (Mon-today). Compare to last week's totals.

## Performance Signals
3-4 bullet points on what the data reveals:
- Pace trends vs prior weeks (improving, maintaining, declining)
- HR efficiency (pace at given HR vs prior weeks — is aerobic fitness building?)
- Recovery quality based on easy run HR and TSB
- Volume trend: is the 4-week progression safe?

## Highlight
Pick the best session this week and explain WHY it was good (pacing, HR control, distance, splits).

## Watch Out
Only mention if genuinely relevant — fatigue, HR drift, volume spike, injury risk. Cite specific numbers.

## Next Week
2-3 specific prescriptions based on the full trend, not just this week. E.g. "Add one tempo at 4:50-5:00/km" or "Reduce volume 10% — ACWR is high."

IMPORTANT:
- Urban running: stops at lights are NORMAL. Elapsed > moving time is fine.
- HR zones are provided — use them to categorize effort levels.
- Keep it under 280 words.
- Be warm but direct. No fluff, no motivational clichés.`,
      },
      {
        role: "user",
        content: context,
      },
    ],
  });
};

export const generatePerformancePrediction = (
  records: StravaPersonalRecord[],
  recentActivities: StravaActivity[],
  fitnessData: FitnessData,
  athleteMaxHr?: number | null,
) => {
  const context = buildPredictionContext(records, recentActivities, fitnessData, athleteMaxHr);

  return streamText({
    model,
    messages: [
      {
        role: "system",
        content: `You are a sports scientist specializing in endurance performance prediction for recreational runners.

Based on training data, PRs, and fitness metrics, provide:

## Current Fitness Assessment
Where the athlete is based on CTL/ATL/TSB, recent volume, and pace trends. Be specific with numbers.

## Race Readiness
Could they race well this weekend? In 2 weeks? In 4 weeks? Consider freshness (TSB), recent long runs, and volume.

## Predicted Race Times
Give realistic predictions for 5K, 10K, Half Marathon, Marathon with confidence ranges (e.g. "10K: 50:00-52:00"). Base these on:
- PR extrapolation (Riegel formula)
- Current training pace adjusted for race effort
- Volume adequacy for each distance
- Fitness trend (improving/maintaining/declining)

## Path to Improvement
What specific training changes would yield the biggest gains in 8 weeks. Be prescriptive: exact paces, distances, session types.

IMPORTANT: Be precise with numbers. Use the data, not generic advice. If data is insufficient for a prediction, say so and explain what's missing.`,
      },
      {
        role: "user",
        content: context,
      },
    ],
  });
};

const buildWeeklyContext = (
  activities: StravaActivity[],
  fitnessData: FitnessData,
  injuryRisk: InjuryRisk,
  records: StravaPersonalRecord[],
  athleteMaxHr?: number | null,
): string => {
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

  // Athlete profile: prefer stored max HR, fall back to best recorded effort
  const maxHr = resolveMaxHr(activities, athleteMaxHr);

  const lines: string[] = [
    "## Athlete Profile:",
    `  Max HR: ${maxHr} bpm${athleteMaxHr ? " (user-set)" : " (derived from activities)"}`,
    "  Heart Rate Zones:",
    formatHrZones(maxHr),
    "",
    `## This Week's Activities (${thisMonday.toLocaleDateString("en", { month: "short", day: "numeric" })} – today):`,
  ];

  if (thisWeek.length === 0) {
    lines.push("  No activities recorded yet this week.");
  }

  for (const a of thisWeek) {
    const paceStr = a.distance > 0 ? formatPace(a.averageSpeed, a.type) : "N/A";
    const hrStr = (a.averageHeartrate ?? 0) > 0
      ? `avg HR ${Math.round(a.averageHeartrate!)}${a.maxHeartrate ? `, max HR ${Math.round(a.maxHeartrate)}` : ""}`
      : "no HR";
    const elevStr = a.totalElevationGain > 0 ? `, +${Math.round(a.totalElevationGain)}m elev` : "";
    const elapsed = a.elapsedTime > a.movingTime
      ? ` (elapsed ${formatDuration(a.elapsedTime)}, urban stops: ${formatDuration(a.elapsedTime - a.movingTime)})`
      : "";

    lines.push(`  - ${a.type}: "${a.name}" — ${(a.distance / 1000).toFixed(2)} km, moving ${formatDuration(a.movingTime)}${elapsed}`);
    lines.push(`    Pace: ${paceStr}, ${hrStr}${elevStr}`);

    const splits = a.splitsMetric as Array<{ distance: number; moving_time: number; average_heartrate?: number }> | null;
    if (splits && splits.length > 0 && splits.length <= 25) {
      const splitPaces = splits.map((s, i) => {
        const pace = s.distance > 0 ? (s.moving_time / s.distance) * 1000 : 0;
        const min = Math.floor(pace / 60);
        const sec = Math.round(pace % 60);
        const hrPart = s.average_heartrate ? ` @${Math.round(s.average_heartrate)}bpm` : "";
        return `${i + 1}:${min}:${sec.toString().padStart(2, "0")}${hrPart}`;
      });
      lines.push(`    Splits (km): ${splitPaces.join(", ")}`);
    }
  }

  // This week totals
  const thisWeekRuns = thisWeek.filter((a) => a.type === "Run");
  const lastWeekRuns = lastWeek.filter((a) => a.type === "Run");

  lines.push("");
  lines.push("## This Week Totals:");
  lines.push(`  Activities: ${thisWeek.length}, Runs: ${thisWeekRuns.length}`);
  lines.push(`  Distance: ${(thisWeek.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)} km`);
  lines.push(`  Time: ${formatDuration(thisWeek.reduce((s, a) => s + a.movingTime, 0))}`);
  lines.push(`  Elevation: +${Math.round(thisWeek.reduce((s, a) => s + a.totalElevationGain, 0))}m`);

  if (thisWeekRuns.length > 0) {
    const totalDist = thisWeekRuns.reduce((s, a) => s + a.distance, 0);
    const totalTime = thisWeekRuns.reduce((s, a) => s + a.movingTime, 0);
    const avgPace = totalDist > 0 ? (totalTime / totalDist) * 1000 : 0;
    const hrRuns = thisWeekRuns.filter((a) => (a.averageHeartrate ?? 0) > 0);
    lines.push(`  Avg running pace: ${Math.floor(avgPace / 60)}:${Math.round(avgPace % 60).toString().padStart(2, "0")}/km`);
    if (hrRuns.length > 0) {
      lines.push(`  Avg HR: ${Math.round(hrRuns.reduce((s, a) => s + (a.averageHeartrate ?? 0), 0) / hrRuns.length)} bpm`);
    }
    if (lastWeekRuns.length > 0) {
      const lastDist = lastWeekRuns.reduce((s, a) => s + a.distance, 0);
      const lastTime = lastWeekRuns.reduce((s, a) => s + a.movingTime, 0);
      const lastAvgPace = lastDist > 0 ? (lastTime / lastDist) * 1000 : 0;
      const paceDiff = avgPace - lastAvgPace;
      lines.push(`  Pace vs last week: ${paceDiff > 0 ? "+" : ""}${paceDiff.toFixed(0)}s/km (${paceDiff < 0 ? "faster" : "slower"})`);
    }
  }

  // Fitness + load
  lines.push("");
  lines.push("## Fitness Status:");
  lines.push(`  CTL (Fitness): ${fitnessData.currentCtl} — ${fitnessData.fitnessLevel}`);
  lines.push(`  ATL (Fatigue): ${fitnessData.currentAtl} — ${fitnessData.fatigueLevel}`);
  lines.push(`  TSB (Form): ${fitnessData.currentTsb} — ${fitnessData.formStatus}`);
  lines.push("");
  lines.push("## Load Management:");
  lines.push(`  ACWR: ${injuryRisk.acwr} (${injuryRisk.riskLevel})`);
  lines.push(`  Weekly load change: ${injuryRisk.weeklyLoadChange}%`);
  lines.push(`  ${injuryRisk.recommendation}`);

  // PRs this week / last week
  if (records.length > 0) {
    const thisWeekPrs = records.filter((r) => new Date(r.achievedAt) >= thisMonday).slice(0, 5);
    if (thisWeekPrs.length > 0) {
      lines.push("");
      lines.push("## New PRs This Week:");
      for (const pr of thisWeekPrs) lines.push(`  - ${pr.distanceName}: ${formatDuration(pr.elapsedTime)}`);
    }
  }

  // 8-week historical volume (compact — one line per week)
  lines.push("");
  lines.push("## Training History — Last 8 Weeks (Mon-Sun, local time):");
  for (let w = 1; w <= 8; w++) {
    const wStart = new Date(thisMonday);
    wStart.setDate(wStart.getDate() - w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const label = w === 1 ? "Last week" : `${w} weeks ago`;
    lines.push(buildWeekSummary(wStart, wEnd, activities, label));
  }

  return lines.join("\n");
};

const buildPredictionContext = (
  records: StravaPersonalRecord[],
  recentActivities: StravaActivity[],
  fitnessData: FitnessData,
  athleteMaxHr?: number | null,
): string => {
  const now = new Date();
  const maxHr = resolveMaxHr(recentActivities, athleteMaxHr);

  // Deduplicate PRs
  const bestByDist = new Map<number, StravaPersonalRecord>();
  for (const r of records) {
    const existing = bestByDist.get(r.distanceMeters);
    if (!existing || r.elapsedTime < existing.elapsedTime) bestByDist.set(r.distanceMeters, r);
  }

  const lines: string[] = [
    "## Athlete Profile:",
    `  Derived Max HR: ${maxHr} bpm`,
    "  Heart Rate Zones:",
    formatHrZones(maxHr),
    "",
    "## Personal Records:",
    ...[...bestByDist.values()]
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .map((r) => `  - ${r.distanceName} (${(r.distanceMeters / 1000).toFixed(2)} km): ${formatDuration(r.elapsedTime)} — ${new Date(r.achievedAt).toLocaleDateString()}`),
    "",
    "## Current Fitness:",
    `  CTL: ${fitnessData.currentCtl} (${fitnessData.fitnessLevel})`,
    `  ATL: ${fitnessData.currentAtl} (${fitnessData.fatigueLevel})`,
    `  TSB: ${fitnessData.currentTsb} (${fitnessData.formStatus})`,
    "",
    "## Last 12 Weeks of Training (Mon-aligned):",
  ];

  const thisMonday = getMondayOf(now);

  for (let w = 0; w < 12; w++) {
    const wStart = new Date(thisMonday);
    wStart.setDate(wStart.getDate() - w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const label = w === 0 ? "This week (so far)" : w === 1 ? "Last week" : `${w} weeks ago`;
    lines.push(buildWeekSummary(wStart, wEnd, recentActivities, label));
  }

  // Pace distribution
  const runs = recentActivities.filter((a) => a.type === "Run" && a.distance > 1000);
  if (runs.length >= 5) {
    const paces = runs.map((a) => (a.movingTime / a.distance) * 1000).sort((a, b) => a - b);
    const fastest = paces[0];
    const slowest = paces[paces.length - 1];
    const median = paces[Math.floor(paces.length / 2)];
    lines.push("");
    lines.push("## Pace Distribution (90 days):");
    lines.push(`  Fastest: ${Math.floor(fastest / 60)}:${Math.round(fastest % 60).toString().padStart(2, "0")}/km`);
    lines.push(`  Median: ${Math.floor(median / 60)}:${Math.round(median % 60).toString().padStart(2, "0")}/km`);
    lines.push(`  Slowest: ${Math.floor(slowest / 60)}:${Math.round(slowest % 60).toString().padStart(2, "0")}/km`);
  }

  return lines.join("\n");
};
