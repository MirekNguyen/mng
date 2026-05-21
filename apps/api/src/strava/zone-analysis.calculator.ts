import type { StravaActivity } from "@mng/database/schema/strava.schema";

export type PaceZone = {
  name: string;
  minPace: number; // sec/km
  maxPace: number; // sec/km
  timeInZone: number; // seconds
  distanceInZone: number; // meters
  percentage: number;
};

export type HeartRateZone = {
  name: string;
  minHr: number;
  maxHr: number;
  timeInZone: number;
  percentage: number;
};

export type ZoneAnalysis = {
  paceZones: PaceZone[];
  heartRateZones: HeartRateZone[];
  averagePace: number; // sec/km
  averageHr: number;
  totalRunningTime: number;
  totalRunningDistance: number;
};

// Standard running pace zones (sec/km)
const PACE_ZONES = [
  { name: "Recovery", minPace: 390, maxPace: 9999 }, // >6:30/km
  { name: "Easy", minPace: 330, maxPace: 390 }, // 5:30-6:30
  { name: "Tempo", minPace: 285, maxPace: 330 }, // 4:45-5:30
  { name: "Threshold", minPace: 255, maxPace: 285 }, // 4:15-4:45
  { name: "Interval", minPace: 225, maxPace: 255 }, // 3:45-4:15
  { name: "Sprint", minPace: 0, maxPace: 225 }, // <3:45
];

// Standard HR zones (% of max HR, estimated max = 220 - age, default 190)
const HR_ZONES = [
  { name: "Zone 1 (Recovery)", minPct: 0, maxPct: 0.6 },
  { name: "Zone 2 (Aerobic)", minPct: 0.6, maxPct: 0.7 },
  { name: "Zone 3 (Tempo)", minPct: 0.7, maxPct: 0.8 },
  { name: "Zone 4 (Threshold)", minPct: 0.8, maxPct: 0.9 },
  { name: "Zone 5 (VO2max)", minPct: 0.9, maxPct: 1.0 },
];

export const calculateZoneAnalysis = (activities: StravaActivity[], maxHr = 190): ZoneAnalysis => {
  const runActivities = activities.filter(
    (a) => a.type === "Run" || a.sportType === "Run" || a.type === "TrailRun",
  );

  let totalRunTime = 0;
  let totalRunDistance = 0;
  let totalHrTime = 0;
  let hrWeightedSum = 0;

  const paceZones: PaceZone[] = PACE_ZONES.map((z) => ({
    ...z,
    timeInZone: 0,
    distanceInZone: 0,
    percentage: 0,
  }));

  const heartRateZones: HeartRateZone[] = HR_ZONES.map((z) => ({
    name: z.name,
    minHr: Math.round(z.minPct * maxHr),
    maxHr: Math.round(z.maxPct * maxHr),
    timeInZone: 0,
    percentage: 0,
  }));

  for (const activity of runActivities) {
    if (activity.distance === 0 || activity.movingTime === 0) continue;

    totalRunTime += activity.movingTime;
    totalRunDistance += activity.distance;

    // Assign to pace zone based on average pace
    const paceSecPerKm = (activity.movingTime / activity.distance) * 1000;
    for (const zone of paceZones) {
      if (paceSecPerKm >= zone.minPace && paceSecPerKm < zone.maxPace) {
        zone.timeInZone += activity.movingTime;
        zone.distanceInZone += activity.distance;
        break;
      }
    }

    // HR zone (use average HR for the whole activity)
    if (activity.averageHeartrate) {
      totalHrTime += activity.movingTime;
      hrWeightedSum += activity.averageHeartrate * activity.movingTime;

      for (const zone of heartRateZones) {
        if (activity.averageHeartrate >= zone.minHr && activity.averageHeartrate < zone.maxHr) {
          zone.timeInZone += activity.movingTime;
          break;
        }
      }
    }
  }

  // Calculate percentages
  for (const zone of paceZones) {
    zone.percentage = totalRunTime > 0 ? (zone.timeInZone / totalRunTime) * 100 : 0;
  }
  for (const zone of heartRateZones) {
    zone.percentage = totalHrTime > 0 ? (zone.timeInZone / totalHrTime) * 100 : 0;
  }

  const averagePace = totalRunDistance > 0 ? (totalRunTime / totalRunDistance) * 1000 : 0;
  const averageHr = totalHrTime > 0 ? hrWeightedSum / totalHrTime : 0;

  return {
    paceZones: paceZones.filter((z) => z.timeInZone > 0),
    heartRateZones: heartRateZones.filter((z) => z.timeInZone > 0),
    averagePace: Math.round(averagePace),
    averageHr: Math.round(averageHr),
    totalRunningTime: totalRunTime,
    totalRunningDistance: totalRunDistance,
  };
};
