import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import type { StravaActivity, StravaPersonalRecord } from "@mng/database/schema/fitness.schema";
import { formatDuration, formatPace } from "./format.utils";
import type { FitnessData } from "./training-load.calculator";
import type { InjuryRisk } from "./predictions.calculator";

const model = google("gemini-3-flash-preview");

export const generateWeeklyBrief = (
  activities: StravaActivity[],
  fitnessData: FitnessData,
  injuryRisk: InjuryRisk,
  records: StravaPersonalRecord[],
) => {
  const context = buildWeeklyContext(activities, fitnessData, injuryRisk, records);

  return streamText({
    model,
    messages: [
      {
        role: "system",
        content: `You are an expert endurance coach reviewing a casual runner's CURRENT training week (Monday to today). This athlete is a health-conscious urban runner — they stop at traffic lights, run in the city, and train for general fitness with occasional race goals.

IMPORTANT: "This week" means Monday through today ONLY. "Last week" is the previous Monday-Sunday. Do NOT mix them up. The data is pre-split for you — "This Week's Activities" is the current week, "Last Week" is comparison data.

Your analysis must be data-driven: reference actual numbers, paces, HR values, and trends from the provided data. Never give generic advice.

Structure your response EXACTLY as:

## Week Summary
2-3 sentences covering what's happened THIS WEEK so far (Mon-today). Compare to last week's totals.

## Performance Signals
3-4 bullet points on what the data reveals:
- Pace trends (improving, maintaining, declining)
- HR efficiency (pace at given HR — is it improving?)
- Recovery quality (resting HR trends, easy run HR)
- Volume progression (safe increase or spike?)

## Highlight
Pick the best session this week and explain WHY it was good (pacing strategy, HR control, distance PR, etc.)

## Watch Out
Only mention if genuinely relevant — fatigue indicators, HR drift on easy runs, volume spike, skipped rest days.

## Next Week
2-3 specific prescriptions based on the data. E.g. "Add one tempo interval session at 4:50-5:00/km pace" or "Keep weekly volume at 35km, but replace one easy run with hills."

IMPORTANT:
- Urban running context: stops at lights are NORMAL. Elapsed > moving time is not a concern.
- Keep it under 250 words.
- Be warm but direct. No fluff, no motivational clichés.
- If data is limited, say what you CAN observe and what you'd need more of.`,
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
) => {
  const context = buildPredictionContext(records, recentActivities, fitnessData);

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
): string => {
  const now = new Date();

  // Use Monday-Sunday training weeks (standard in running)
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(thisMonday.getDate() - daysSinceMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  const thisWeek = activities.filter((a) => new Date(a.startDate) >= thisMonday);
  const lastWeek = activities.filter((a) => {
    const d = new Date(a.startDate);
    return d >= lastMonday && d < thisMonday;
  });

  const lines: string[] = [
    `## This Week's Activities (${thisMonday.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en", { month: "short", day: "numeric" })}):`,
  ];

  for (const a of thisWeek) {
    const paceStr = a.distance > 0 ? formatPace(a.averageSpeed, a.type) : "N/A";
    const hrStr = a.averageHeartrate > 0 ? `avg HR ${Math.round(a.averageHeartrate)}${a.maxHeartrate ? `, max HR ${Math.round(a.maxHeartrate)}` : ""}` : "no HR";
    const elevStr = a.totalElevationGain > 0 ? `, +${Math.round(a.totalElevationGain)}m elev` : "";
    const elapsed = a.elapsedTime > a.movingTime ? ` (elapsed ${formatDuration(a.elapsedTime)}, stops: ${formatDuration(a.elapsedTime - a.movingTime)})` : "";

    lines.push(`  - ${a.type}: "${a.name}" — ${(a.distance / 1000).toFixed(2)}km, moving ${formatDuration(a.movingTime)}${elapsed}`);
    lines.push(`    Pace: ${paceStr}, ${hrStr}${elevStr}`);

    // Include splits if available
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

  // Week totals
  const thisWeekRuns = thisWeek.filter((a) => a.type === "Run");
  const lastWeekRuns = lastWeek.filter((a) => a.type === "Run");

  lines.push("");
  lines.push("## Week Totals:");
  lines.push(`  All activities: ${thisWeek.length} (last week: ${lastWeek.length})`);
  lines.push(`  Total distance: ${(thisWeek.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)} km (last week: ${(lastWeek.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)} km)`);
  lines.push(`  Total time: ${formatDuration(thisWeek.reduce((s, a) => s + a.movingTime, 0))} (last week: ${formatDuration(lastWeek.reduce((s, a) => s + a.movingTime, 0))})`);
  lines.push(`  Total elevation: +${Math.round(thisWeek.reduce((s, a) => s + a.totalElevationGain, 0))}m`);

  if (thisWeekRuns.length > 0) {
    const avgPace = thisWeekRuns.reduce((s, a) => s + a.movingTime, 0) / thisWeekRuns.reduce((s, a) => s + a.distance, 0) * 1000;
    const avgHr = thisWeekRuns.filter((a) => a.averageHeartrate > 0);
    lines.push("");
    lines.push("## Running Specifics:");
    lines.push(`  Runs: ${thisWeekRuns.length}, Distance: ${(thisWeekRuns.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)} km`);
    lines.push(`  Avg pace: ${Math.floor(avgPace / 60)}:${Math.round(avgPace % 60).toString().padStart(2, "0")}/km`);
    if (avgHr.length > 0) {
      lines.push(`  Avg HR: ${Math.round(avgHr.reduce((s, a) => s + a.averageHeartrate, 0) / avgHr.length)} bpm`);
    }

    // Compare to last week
    if (lastWeekRuns.length > 0) {
      const lastAvgPace = lastWeekRuns.reduce((s, a) => s + a.movingTime, 0) / lastWeekRuns.reduce((s, a) => s + a.distance, 0) * 1000;
      const paceDiff = avgPace - lastAvgPace;
      lines.push(`  Pace vs last week: ${paceDiff > 0 ? "+" : ""}${paceDiff.toFixed(0)}s/km (${paceDiff < 0 ? "faster" : "slower"})`);
    }
  }

  // Fitness status
  lines.push("");
  lines.push("## Fitness Status:");
  lines.push(`  CTL (Fitness): ${fitnessData.currentCtl} — ${fitnessData.fitnessLevel}`);
  lines.push(`  ATL (Fatigue): ${fitnessData.currentAtl} — ${fitnessData.fatigueLevel}`);
  lines.push(`  TSB (Form): ${fitnessData.currentTsb} — ${fitnessData.formStatus}`);

  // Injury risk
  lines.push("");
  lines.push("## Load Management:");
  lines.push(`  ACWR: ${injuryRisk.acwr} (${injuryRisk.riskLevel})`);
  lines.push(`  Weekly load change: ${injuryRisk.weeklyLoadChange}%`);
  lines.push(`  ${injuryRisk.recommendation}`);

  // Recent PRs
  if (records.length > 0) {
    const recentPrs = records
      .filter((r) => new Date(r.achievedAt) >= thisMonday)
      .slice(0, 5);
    if (recentPrs.length > 0) {
      lines.push("");
      lines.push("## New PRs This Week:");
      for (const pr of recentPrs) {
        lines.push(`  - ${pr.distanceName}: ${formatDuration(pr.elapsedTime)}`);
      }
    }

    const lastWeekPrs = records
      .filter((r) => { const d = new Date(r.achievedAt); return d >= lastMonday && d < thisMonday; })
      .slice(0, 5);
    if (lastWeekPrs.length > 0) {
      lines.push("");
      lines.push("## PRs Last Week:");
      for (const pr of lastWeekPrs) {
        lines.push(`  - ${pr.distanceName}: ${formatDuration(pr.elapsedTime)}`);
      }
    }
  }

  // 4-week volume trend (Monday-aligned weeks)
  const weeklyVolumes: number[] = [];
  for (let w = 0; w < 4; w++) {
    const wStart = new Date(thisMonday);
    wStart.setDate(wStart.getDate() - w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const weekDist = activities
      .filter((a) => { const d = new Date(a.startDate); return d >= wStart && d < wEnd; })
      .reduce((s, a) => s + a.distance, 0);
    weeklyVolumes.push(Math.round(weekDist / 1000 * 10) / 10);
  }
  lines.push("");
  lines.push("## 4-Week Volume Trend (km, Mon-Sun weeks):");
  lines.push(`  This week (so far): ${weeklyVolumes[0]}, last week: ${weeklyVolumes[1]}, -2w: ${weeklyVolumes[2]}, -3w: ${weeklyVolumes[3]}`);

  return lines.join("\n");
};

const buildPredictionContext = (
  records: StravaPersonalRecord[],
  recentActivities: StravaActivity[],
  fitnessData: FitnessData,
): string => {
  // Deduplicate PRs
  const bestByDist = new Map<number, StravaPersonalRecord>();
  for (const r of records) {
    const existing = bestByDist.get(r.distanceMeters);
    if (!existing || r.elapsedTime < existing.elapsedTime) bestByDist.set(r.distanceMeters, r);
  }

  const lines: string[] = [
    "## Personal Records:",
    ...[...bestByDist.values()]
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .map((r) => `  - ${r.distanceName} (${(r.distanceMeters / 1000).toFixed(2)}km): ${formatDuration(r.elapsedTime)} — achieved ${new Date(r.achievedAt).toLocaleDateString()}`),
    "",
    "## Current Fitness:",
    `  CTL: ${fitnessData.currentCtl} (${fitnessData.fitnessLevel})`,
    `  ATL: ${fitnessData.currentAtl} (${fitnessData.fatigueLevel})`,
    `  TSB: ${fitnessData.currentTsb} (${fitnessData.formStatus})`,
    "",
    "## Last 6 Weeks of Training:",
  ];

  // Detailed weekly breakdown
  const now = new Date();
  const runs = recentActivities.filter((a) => a.type === "Run" && a.distance > 1000);

  for (let w = 0; w < 6; w++) {
    const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekRuns = runs.filter((a) => {
      const d = new Date(a.startDate);
      return d >= weekStart && d < weekEnd;
    });

    const dist = weekRuns.reduce((s, a) => s + a.distance, 0);
    const time = weekRuns.reduce((s, a) => s + a.movingTime, 0);
    const avgPace = dist > 0 ? (time / dist) * 1000 : 0;
    const avgHr = weekRuns.filter((a) => a.averageHeartrate > 0);
    const hrStr = avgHr.length > 0 ? `, avg HR ${Math.round(avgHr.reduce((s, a) => s + a.averageHeartrate, 0) / avgHr.length)}` : "";
    const longest = weekRuns.length > 0 ? Math.max(...weekRuns.map((a) => a.distance)) : 0;

    lines.push(`  Week -${w}: ${weekRuns.length} runs, ${(dist / 1000).toFixed(1)}km, ${formatDuration(time)}, pace ${Math.floor(avgPace / 60)}:${Math.round(avgPace % 60).toString().padStart(2, "0")}/km${hrStr}, longest ${(longest / 1000).toFixed(1)}km`);
  }

  // Pace distribution
  if (runs.length >= 5) {
    const paces = runs.map((a) => (a.movingTime / a.distance) * 1000).sort((a, b) => a - b);
    const fastest = paces[0];
    const slowest = paces[paces.length - 1];
    const median = paces[Math.floor(paces.length / 2)];
    lines.push("");
    lines.push("## Pace Distribution (last 90 days):");
    lines.push(`  Fastest: ${Math.floor(fastest / 60)}:${Math.round(fastest % 60).toString().padStart(2, "0")}/km`);
    lines.push(`  Median: ${Math.floor(median / 60)}:${Math.round(median % 60).toString().padStart(2, "0")}/km`);
    lines.push(`  Slowest: ${Math.floor(slowest / 60)}:${Math.round(slowest % 60).toString().padStart(2, "0")}/km`);
  }

  return lines.join("\n");
};
