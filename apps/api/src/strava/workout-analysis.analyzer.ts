import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { StravaActivity } from "@mng/database/schema/strava.schema";
import { formatDuration, formatPace } from "./format.utils";

const model = google("gemini-3.1-pro-preview");

const WorkoutAnalysisSchema = z.object({
  effortRating: z.number().min(1).max(10).describe("Effort intensity 1-10"),
  pacingStrategy: z.enum(["negative_split", "positive_split", "even", "variable"]),
  pacingAnalysis: z.string().describe("1-2 sentence pacing breakdown"),
  strengths: z.array(z.string()).describe("2-3 things done well"),
  improvements: z.array(z.string()).describe("1-2 areas to improve"),
  recoveryRecommendation: z.string().describe("Recovery advice for next 24-48h"),
  trainingEffect: z.enum(["recovery", "base", "tempo", "threshold", "vo2max", "anaerobic"]),
  summary: z.string().describe("2-3 sentence overall analysis"),
});

export type WorkoutAnalysis = z.infer<typeof WorkoutAnalysisSchema>;

export const analyzeWorkout = async (
  activity: StravaActivity,
  recentActivities: StravaActivity[],
): Promise<WorkoutAnalysis> => {
  const context = buildActivityContext(activity, recentActivities);

  const { object } = await generateObject({
    model,
    schema: WorkoutAnalysisSchema,
    messages: [
      {
        role: "system",
        content: `You are a supportive running coach analyzing workout data for a casual runner in a city environment. Key guidelines:
- Urban runners stop for traffic lights, crosswalks, and intersections — this is NORMAL, not a pacing flaw. Never criticize stops or variable pace due to city running.
- The difference between moving time and elapsed time reflects urban stops, not poor discipline.
- Speed spikes and drops are expected in city terrain. Focus on the moving pace, not the raw data noise.
- Be encouraging and practical. This person runs for health and enjoyment, not competition.
- Base weekly volume only on the "Recent training context" provided — do NOT inflate or assume additional workouts.
- Keep feedback concise, warm, and actionable.`,
      },
      {
        role: "user",
        content: context,
      },
    ],
  });

  return object;
};

const buildActivityContext = (activity: StravaActivity, recentActivities: StravaActivity[]): string => {
  const lines: string[] = [
    `## Activity: ${activity.name}`,
    `Type: ${activity.type} (${activity.sportType})`,
    `Distance: ${(activity.distance / 1000).toFixed(2)} km`,
    `Moving Time: ${formatDuration(activity.movingTime)}`,
    `Elapsed Time: ${formatDuration(activity.elapsedTime)} (difference is urban stops — traffic lights, crosswalks)`,
    `Avg Pace (moving): ${formatPace(activity.averageSpeed, activity.type)}`,
    `Elevation: +${Math.round(activity.totalElevationGain)}m`,
  ];

  if (activity.averageHeartrate) {
    lines.push(`Avg HR: ${Math.round(activity.averageHeartrate)} bpm`);
  }
  if (activity.maxHeartrate) {
    lines.push(`Max HR: ${Math.round(activity.maxHeartrate)} bpm`);
  }
  if (activity.averageCadence) {
    lines.push(`Cadence: ${Math.round(activity.averageCadence)} spm`);
  }
  if (activity.calories) {
    lines.push(`Calories: ${Math.round(activity.calories)}`);
  }

  const splits = activity.splitsMetric ?? activity.splits;
  if (splits && Array.isArray(splits)) {
    lines.push(`\n## Splits (per km, moving pace only):`);
    for (const split of splits.slice(0, 20)) {
      const s = split as { distance: number; moving_time: number; average_heartrate?: number; split: number };
      const pace = s.moving_time / (s.distance / 1000);
      const min = Math.floor(pace / 60);
      const sec = Math.round(pace % 60);
      lines.push(`  km ${s.split}: ${min}:${sec.toString().padStart(2, "0")}/km${s.average_heartrate ? ` (${Math.round(s.average_heartrate)} bpm)` : ""}`);
    }
  }

  // Exclude current activity from recent context
  const otherRecent = recentActivities.filter((a) => a.stravaId !== activity.stravaId);
  if (otherRecent.length > 0) {
    lines.push(`\n## Other training this week (last 7 days, excluding this run):`);
    for (const a of otherRecent.slice(0, 5)) {
      lines.push(`  - ${a.type}: ${(a.distance / 1000).toFixed(1)}km in ${formatDuration(a.movingTime)}`);
    }
  } else {
    lines.push(`\n## Other training this week: None — this was the only activity in the last 7 days.`);
  }

  return lines.join("\n");
};
