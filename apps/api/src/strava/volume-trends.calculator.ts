import type { StravaActivity } from "@mng/database/schema/fitness.schema";

export type WeeklyVolume = {
  weekStart: string;
  distance: number;
  movingTime: number;
  elevationGain: number;
  activityCount: number;
  sports: Record<string, { distance: number; movingTime: number; elevationGain: number; count: number }>;
};

export type MonthlyVolume = {
  month: string;
  distance: number;
  movingTime: number;
  elevationGain: number;
  activityCount: number;
  sports: Record<string, { distance: number; movingTime: number; elevationGain: number; count: number }>;
};

export type VolumeTrends = {
  weekly: WeeklyVolume[];
  monthly: MonthlyVolume[];
  totalDistance: number;
  totalTime: number;
  totalActivities: number;
  averageWeeklyDistance: number;
  averageWeeklyTime: number;
};

const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  return d.toISOString().split("T")[0];
};

const getMonth = (date: Date): string => {
  return date.toISOString().slice(0, 7); // "2025-01"
};

export const calculateVolumeTrends = (activities: StravaActivity[]): VolumeTrends => {
  const weeklyMap = new Map<string, WeeklyVolume>();
  const monthlyMap = new Map<string, MonthlyVolume>();

  let totalDistance = 0;
  let totalTime = 0;

  for (const activity of activities) {
    const date = new Date(activity.startDateLocal);
    const weekStart = getWeekStart(date);
    const month = getMonth(date);

    totalDistance += activity.distance;
    totalTime += activity.movingTime;

    // Weekly
    const week = weeklyMap.get(weekStart) ?? {
      weekStart,
      distance: 0,
      movingTime: 0,
      elevationGain: 0,
      activityCount: 0,
      sports: {},
    };
    week.distance += activity.distance;
    week.movingTime += activity.movingTime;
    week.elevationGain += activity.totalElevationGain;
    week.activityCount++;
    if (!week.sports[activity.type]) {
      week.sports[activity.type] = { distance: 0, movingTime: 0, elevationGain: 0, count: 0 };
    }
    week.sports[activity.type].distance += activity.distance;
    week.sports[activity.type].movingTime += activity.movingTime;
    week.sports[activity.type].elevationGain += activity.totalElevationGain;
    week.sports[activity.type].count++;
    weeklyMap.set(weekStart, week);

    // Monthly
    const mo = monthlyMap.get(month) ?? {
      month,
      distance: 0,
      movingTime: 0,
      elevationGain: 0,
      activityCount: 0,
      sports: {},
    };
    mo.distance += activity.distance;
    mo.movingTime += activity.movingTime;
    mo.elevationGain += activity.totalElevationGain;
    mo.activityCount++;
    if (!mo.sports[activity.type]) {
      mo.sports[activity.type] = { distance: 0, movingTime: 0, elevationGain: 0, count: 0 };
    }
    mo.sports[activity.type].distance += activity.distance;
    mo.sports[activity.type].movingTime += activity.movingTime;
    mo.sports[activity.type].elevationGain += activity.totalElevationGain;
    mo.sports[activity.type].count++;
    monthlyMap.set(month, mo);
  }

  // Ensure current (partial) week always appears, even with zero activities
  const currentWeekStart = getWeekStart(new Date());
  if (!weeklyMap.has(currentWeekStart)) {
    weeklyMap.set(currentWeekStart, {
      weekStart: currentWeekStart,
      distance: 0,
      movingTime: 0,
      elevationGain: 0,
      activityCount: 0,
      sports: {},
    });
  }

  const weekly = [...weeklyMap.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const monthly = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  const weekCount = weekly.length;

  return {
    weekly,
    monthly,
    totalDistance,
    totalTime,
    totalActivities: activities.length,
    averageWeeklyDistance: totalDistance / weekCount,
    averageWeeklyTime: totalTime / weekCount,
  };
};
