import type { StravaActivity } from "@mng/database/schema/strava.schema";
import type { StravaPersonalRecord } from "@mng/database/schema/strava.schema";

/**
 * Race predictions using a holistic approach:
 *
 * 1. PR-based Riegel predictions (weighted, multi-reference)
 * 2. Current fitness adjustment from recent training:
 *    - Recent run pace trends (improving/declining)
 *    - Training volume (weekly km) → endurance readiness
 *    - HR efficiency (pace-at-HR) if HR data available
 *    - Long run readiness (longest recent run vs target)
 *
 * The final prediction blends PR-based math with current fitness context.
 */

export type RacePrediction = {
  distance: string;
  distanceMeters: number;
  predictedTime: number; // seconds
  predictedPace: number; // sec/km
  confidence: "high" | "medium" | "low";
  basedOn: string;
};

export type InjuryRisk = {
  acwr: number;
  riskLevel: "low" | "moderate" | "high" | "very_high";
  weeklyLoadChange: number;
  recommendation: string;
};

export type TrainingInsight = {
  type: "warning" | "info" | "success";
  title: string;
  message: string;
};

const RACE_DISTANCES = [
  { name: "5K", meters: 5000 },
  { name: "10K", meters: 10000 },
  { name: "Half Marathon", meters: 21097 },
  { name: "Marathon", meters: 42195 },
];

// Minimum reference distance for each target
const MIN_REFERENCE_DISTANCES: Record<number, number> = {
  5000: 1500,
  10000: 3000,
  21097: 5000,
  42195: 10000,
};

// Adaptive Riegel fatigue factor
const getFatigueFactor = (referenceMeters: number, targetMeters: number): number => {
  const ratio = targetMeters / referenceMeters;
  if (ratio <= 2) return 1.06;
  if (ratio <= 4) return 1.07;
  if (ratio <= 8) return 1.08;
  return 1.09;
};

const getReferenceWeight = (reference: StravaPersonalRecord, targetMeters: number): number => {
  const ratio = targetMeters / reference.distanceMeters;
  if (ratio < 1) return ratio > 0.5 ? 0.6 : 0.3;
  if (ratio <= 2) return 1.0;
  if (ratio <= 3) return 0.8;
  if (ratio <= 5) return 0.5;
  if (ratio <= 8) return 0.3;
  return 0.1;
};

const getRecencyWeight = (achievedAt: Date | string): number => {
  const achieved = new Date(achievedAt);
  const now = new Date();
  const monthsAgo = (now.getTime() - achieved.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo <= 3) return 1.0;
  if (monthsAgo <= 6) return 0.9;
  if (monthsAgo <= 12) return 0.7;
  return 0.5;
};

// --- Current Training Analysis ---

type TrainingFitness = {
  /** Average pace of recent runs (sec/km), lower = faster */
  recentAvgPace: number;
  /** Pace trend: negative = getting faster, positive = slowing */
  paceTrendPercent: number;
  /** Weekly volume in km (last 4 weeks avg) */
  weeklyVolumeKm: number;
  /** Longest run in last 6 weeks (meters) */
  longestRecentRun: number;
  /** Average HR on easy runs (if available) */
  avgEasyHr: number | null;
  /** Cardiac drift: HR efficiency trend */
  hrEfficiencyTrend: number | null;
  /** Number of runs analyzed */
  runCount: number;
};

const analyzeCurrentTraining = (activities: StravaActivity[]): TrainingFitness | null => {
  const runs = activities
    .filter((a) => a.type === "Run" && a.distance > 1000 && a.movingTime > 300)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  if (runs.length < 3) return null;

  // Split into halves to detect trend
  const mid = Math.floor(runs.length / 2);
  const firstHalf = runs.slice(0, mid);
  const secondHalf = runs.slice(mid);

  const avgPace = (subset: StravaActivity[]): number => {
    const totalDist = subset.reduce((s, a) => s + a.distance, 0);
    const totalTime = subset.reduce((s, a) => s + a.movingTime, 0);
    return totalDist > 0 ? (totalTime / totalDist) * 1000 : 0;
  };

  const firstPace = avgPace(firstHalf);
  const secondPace = avgPace(secondHalf);
  const paceTrendPercent = firstPace > 0 ? ((secondPace - firstPace) / firstPace) * 100 : 0;

  // Weekly volume (last 4 weeks)
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recentRuns = runs.filter((a) => new Date(a.startDate) >= fourWeeksAgo);
  const weeklyVolumeKm = (recentRuns.reduce((s, a) => s + a.distance, 0) / 1000) / 4;

  // Longest run in last 6 weeks
  const sixWeeksAgo = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000);
  const last6WeekRuns = runs.filter((a) => new Date(a.startDate) >= sixWeeksAgo);
  const longestRecentRun = Math.max(...last6WeekRuns.map((a) => a.distance), 0);

  // HR analysis (easy runs = slower than avg pace)
  const overallAvgPace = avgPace(runs);
  const easyRuns = recentRuns.filter((a) =>
    a.distance > 0 && (a.movingTime / a.distance) * 1000 > overallAvgPace * 0.95 && a.averageHeartrate > 0
  );

  const avgEasyHr = easyRuns.length >= 2
    ? easyRuns.reduce((s, a) => s + a.averageHeartrate, 0) / easyRuns.length
    : null;

  // HR efficiency trend (pace/HR — higher = more efficient)
  const runsWithHr = runs.filter((a) => a.averageHeartrate > 0 && a.distance > 2000);
  let hrEfficiencyTrend: number | null = null;
  if (runsWithHr.length >= 6) {
    const hrMid = Math.floor(runsWithHr.length / 2);
    const efficiency = (subset: StravaActivity[]): number => {
      // Speed (m/s) per beat — higher = fitter
      return subset.reduce((s, a) => s + (a.distance / a.movingTime) / a.averageHeartrate, 0) / subset.length;
    };
    const firstEff = efficiency(runsWithHr.slice(0, hrMid));
    const secondEff = efficiency(runsWithHr.slice(hrMid));
    hrEfficiencyTrend = firstEff > 0 ? ((secondEff - firstEff) / firstEff) * 100 : null;
  }

  return {
    recentAvgPace: avgPace(recentRuns.length >= 3 ? recentRuns : runs),
    paceTrendPercent,
    weeklyVolumeKm,
    longestRecentRun,
    avgEasyHr,
    hrEfficiencyTrend,
    runCount: runs.length,
  };
};

/**
 * Calculate a fitness adjustment multiplier.
 * < 1.0 means current fitness suggests faster than PR-based prediction.
 * > 1.0 means current fitness suggests slower.
 */
const getFitnessAdjustment = (fitness: TrainingFitness, targetMeters: number): number => {
  let adjustment = 1.0;

  // Pace trend: if getting faster, predict slightly faster
  if (fitness.paceTrendPercent < -3) {
    adjustment *= 0.98; // Significant improvement → 2% faster
  } else if (fitness.paceTrendPercent < -1) {
    adjustment *= 0.99; // Mild improvement → 1% faster
  } else if (fitness.paceTrendPercent > 3) {
    adjustment *= 1.02; // Getting slower → predict conservative
  }

  // HR efficiency improvement
  if (fitness.hrEfficiencyTrend !== null) {
    if (fitness.hrEfficiencyTrend > 5) {
      adjustment *= 0.98; // Cardiac fitness improving
    } else if (fitness.hrEfficiencyTrend < -5) {
      adjustment *= 1.02; // Cardiac fitness declining
    }
  }

  // Long run readiness for half/marathon
  if (targetMeters >= 21097) {
    const readinessRatio = fitness.longestRecentRun / targetMeters;
    if (readinessRatio < 0.4) {
      // Haven't run long enough recently — significant fatigue penalty
      adjustment *= 1.05;
    } else if (readinessRatio < 0.6) {
      adjustment *= 1.02;
    }
    // Good long run coverage → no penalty
  }

  // Volume adequacy for target distance
  const weeklyKmNeeded = targetMeters >= 42195 ? 50 : targetMeters >= 21097 ? 35 : targetMeters >= 10000 ? 25 : 15;
  const volumeRatio = fitness.weeklyVolumeKm / weeklyKmNeeded;
  if (volumeRatio < 0.5) {
    adjustment *= 1.04; // Very undertrained for this distance
  } else if (volumeRatio < 0.7) {
    adjustment *= 1.02; // Somewhat undertrained
  }

  return adjustment;
};

export const predictRaceTimes = (
  records: StravaPersonalRecord[],
  recentActivities?: StravaActivity[],
): RacePrediction[] => {
  if (records.length === 0) return [];

  // Deduplicate records (best time per distance)
  const bestByDistance = new Map<number, StravaPersonalRecord>();
  for (const record of records) {
    const existing = bestByDistance.get(record.distanceMeters);
    if (!existing || record.elapsedTime < existing.elapsedTime) {
      bestByDistance.set(record.distanceMeters, record);
    }
  }
  const uniqueRecords = [...bestByDistance.values()];

  // Analyze current training fitness
  const fitness = recentActivities ? analyzeCurrentTraining(recentActivities) : null;

  const predictions: RacePrediction[] = [];

  for (const target of RACE_DISTANCES) {
    const minRef = MIN_REFERENCE_DISTANCES[target.meters] ?? 1500;
    const eligible = uniqueRecords.filter((r) => r.distanceMeters >= minRef);
    if (eligible.length === 0) continue;

    // Weighted prediction from all eligible references
    let weightedTimeSum = 0;
    let weightSum = 0;
    const usedRefs: Array<{ name: string; time: number; weight: number }> = [];

    for (const ref of eligible) {
      const fatigueFactor = getFatigueFactor(ref.distanceMeters, target.meters);
      const predictedTime = ref.elapsedTime * Math.pow(target.meters / ref.distanceMeters, fatigueFactor);

      const distanceWeight = getReferenceWeight(ref, target.meters);
      const recencyWeight = getRecencyWeight(ref.achievedAt);
      const combinedWeight = distanceWeight * recencyWeight;

      if (combinedWeight > 0.1) {
        weightedTimeSum += predictedTime * combinedWeight;
        weightSum += combinedWeight;
        usedRefs.push({ name: ref.distanceName, time: ref.elapsedTime, weight: combinedWeight });
      }
    }

    if (weightSum === 0) continue;

    let predictedTime = weightedTimeSum / weightSum;

    // Apply fitness adjustment from current training
    if (fitness) {
      const fitnessAdj = getFitnessAdjustment(fitness, target.meters);
      predictedTime *= fitnessAdj;
    }

    const predictedPace = (predictedTime / target.meters) * 1000;

    // Confidence
    const hasDirectPR = uniqueRecords.some((r) => Math.abs(r.distanceMeters - target.meters) < 500);
    const closestRatio = Math.min(...eligible.map((r) => Math.max(target.meters / r.distanceMeters, r.distanceMeters / target.meters)));
    const hasGoodFitness = fitness !== null && fitness.runCount >= 10;

    const confidence: "high" | "medium" | "low" =
      hasDirectPR && hasGoodFitness ? "high" :
      hasDirectPR || (closestRatio <= 2 && hasGoodFitness) ? "medium" : "low";

    // Description
    const topRef = usedRefs.sort((a, b) => b.weight - a.weight)[0];
    const fitnessNote = fitness ? " + current training" : "";
    const basedOnText = usedRefs.length > 1
      ? `${topRef.name} PR (${formatSeconds(topRef.time)}) + ${usedRefs.length - 1} other${usedRefs.length > 2 ? "s" : ""}${fitnessNote}`
      : `${topRef.name} PR (${formatSeconds(topRef.time)})${fitnessNote}`;

    predictions.push({
      distance: target.name,
      distanceMeters: target.meters,
      predictedTime: Math.round(predictedTime),
      predictedPace: Math.round(predictedPace),
      confidence,
      basedOn: basedOnText,
    });
  }

  return predictions;
};

export const calculateInjuryRisk = (activities: StravaActivity[]): InjuryRisk => {
  const now = new Date();

  const getWeekLoad = (weeksAgo: number): number => {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weeksAgo * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    return activities
      .filter((a) => {
        const d = new Date(a.startDate);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, a) => sum + a.movingTime / 60, 0);
  };

  const acuteLoad = getWeekLoad(0);
  const chronicLoad = (getWeekLoad(1) + getWeekLoad(2) + getWeekLoad(3) + getWeekLoad(4)) / 4;

  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
  const weeklyLoadChange = chronicLoad > 0 ? ((acuteLoad - getWeekLoad(1)) / getWeekLoad(1)) * 100 : 0;

  const riskLevel: InjuryRisk["riskLevel"] =
    acwr > 1.5 ? "very_high" :
    acwr > 1.3 ? "high" :
    acwr > 0.8 ? "moderate" : "low";

  const recommendation =
    acwr > 1.5 ? "Significantly reduce training volume. High injury risk." :
    acwr > 1.3 ? "Consider reducing intensity. Monitor for fatigue signs." :
    acwr < 0.8 ? "Training load is low. Safe to gradually increase." :
    "Training load is in the optimal range. Maintain current approach.";

  return {
    acwr: Math.round(acwr * 100) / 100,
    riskLevel,
    weeklyLoadChange: Math.round(weeklyLoadChange),
    recommendation,
  };
};

export const generateTrainingInsights = (
  activities: StravaActivity[],
  injuryRisk: InjuryRisk,
): TrainingInsight[] => {
  const insights: TrainingInsight[] = [];
  const now = new Date();

  const lastWeek = activities.filter((a) => {
    const d = new Date(a.startDate);
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });

  const prevWeek = activities.filter((a) => {
    const d = new Date(a.startDate);
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 7 && diff <= 14;
  });

  if (lastWeek.length === 0) {
    insights.push({
      type: "warning",
      title: "No recent activity",
      message: "You haven't logged any activities this week. Consider a light session to maintain fitness.",
    });
  }

  if (injuryRisk.weeklyLoadChange > 30) {
    insights.push({
      type: "warning",
      title: "Volume spike detected",
      message: `Training volume increased ${injuryRisk.weeklyLoadChange}% vs last week. Keep the 10% rule in mind.`,
    });
  }

  if (lastWeek.length >= 4 && prevWeek.length >= 4) {
    insights.push({
      type: "success",
      title: "Great consistency",
      message: "You've maintained 4+ activities per week. Consistency drives adaptation.",
    });
  }

  const runActivities = lastWeek.filter((a) => a.type === "Run");
  if (runActivities.length >= 3) {
    const avgPace = runActivities.reduce((sum, a) => sum + (a.distance > 0 ? a.movingTime / a.distance * 1000 : 0), 0) / runActivities.length;
    const easyRuns = runActivities.filter((a) => a.distance > 0 && (a.movingTime / a.distance * 1000) > avgPace * 1.05);
    const easyPercentage = (easyRuns.length / runActivities.length) * 100;

    if (easyPercentage < 60) {
      insights.push({
        type: "info",
        title: "More easy runs needed",
        message: `Only ${Math.round(easyPercentage)}% of runs are easy. Aim for 80% easy, 20% hard (80/20 rule).`,
      });
    }
  }

  return insights;
};

const formatSeconds = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};
