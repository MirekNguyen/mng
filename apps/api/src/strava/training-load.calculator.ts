import type { StravaActivity } from "@mng/database/schema/strava.schema";

/**
 * Training Load / Fitness-Fatigue Model
 *
 * CTL (Chronic Training Load) = 42-day exponentially weighted avg of daily TSS
 * ATL (Acute Training Load) = 7-day exponentially weighted avg of daily TSS
 * TSB (Training Stress Balance) = CTL - ATL (positive = fresh, negative = fatigued)
 *
 * TSS (Training Stress Score) is estimated from:
 * - Running: based on duration and intensity (pace relative to threshold)
 * - Cycling: power-based if available, otherwise duration * intensity
 * - Other: duration-based with sport multiplier
 */

const SPORT_MULTIPLIERS: Record<string, number> = {
  Run: 1.0,
  Ride: 0.7,
  Swim: 0.8,
  Walk: 0.4,
  Hike: 0.6,
  WeightTraining: 0.5,
  Yoga: 0.3,
  Workout: 0.6,
};

export type DailyTrainingLoad = {
  date: string;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
};

export type FitnessData = {
  daily: DailyTrainingLoad[];
  currentCtl: number;
  currentAtl: number;
  currentTsb: number;
  fitnessLevel: string;
  fatigueLevel: string;
  formStatus: string;
};

const estimateTss = (activity: StravaActivity): number => {
  const multiplier = SPORT_MULTIPLIERS[activity.type] ?? 0.5;
  const durationHours = activity.movingTime / 3600;

  // If HR data available, use intensity factor
  if (activity.averageHeartrate && activity.maxHeartrate) {
    const intensityFactor = activity.averageHeartrate / activity.maxHeartrate;
    return durationHours * intensityFactor * intensityFactor * 100 * multiplier;
  }

  // Fallback: duration-based with speed factor
  const speedFactor = activity.averageSpeed > 0 ? Math.min(activity.averageSpeed / 3.5, 2.0) : 1.0;
  return durationHours * speedFactor * 60 * multiplier;
};

export const calculateFitnessData = (activities: StravaActivity[], days = 90): FitnessData => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Build daily TSS map
  const dailyTss = new Map<string, number>();

  for (const activity of activities) {
    const date = new Date(activity.startDateLocal).toISOString().split("T")[0];
    const tss = estimateTss(activity);
    dailyTss.set(date, (dailyTss.get(date) ?? 0) + tss);
  }

  // Calculate CTL/ATL/TSB using exponential weighted moving average
  const CTL_DAYS = 42;
  const ATL_DAYS = 7;
  const ctlDecay = 1 - Math.exp(-1 / CTL_DAYS);
  const atlDecay = 1 - Math.exp(-1 / ATL_DAYS);

  let ctl = 0;
  let atl = 0;
  const daily: DailyTrainingLoad[] = [];

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const tss = dailyTss.get(dateStr) ?? 0;
    ctl = ctl + ctlDecay * (tss - ctl);
    atl = atl + atlDecay * (tss - atl);
    const tsb = ctl - atl;

    daily.push({ date: dateStr, tss, ctl, atl, tsb });
  }

  const currentCtl = ctl;
  const currentAtl = atl;
  const currentTsb = ctl - atl;

  return {
    daily,
    currentCtl: Math.round(currentCtl * 10) / 10,
    currentAtl: Math.round(currentAtl * 10) / 10,
    currentTsb: Math.round(currentTsb * 10) / 10,
    fitnessLevel: getFitnessLevel(currentCtl),
    fatigueLevel: getFatigueLevel(currentAtl),
    formStatus: getFormStatus(currentTsb),
  };
};

const getFitnessLevel = (ctl: number): string => {
  if (ctl >= 80) return "Elite";
  if (ctl >= 60) return "High";
  if (ctl >= 40) return "Moderate";
  if (ctl >= 20) return "Building";
  return "Low";
};

const getFatigueLevel = (atl: number): string => {
  if (atl >= 100) return "Very High";
  if (atl >= 70) return "High";
  if (atl >= 40) return "Moderate";
  return "Low";
};

const getFormStatus = (tsb: number): string => {
  if (tsb >= 20) return "Very Fresh";
  if (tsb >= 5) return "Fresh";
  if (tsb >= -10) return "Neutral";
  if (tsb >= -25) return "Tired";
  return "Very Fatigued";
};
