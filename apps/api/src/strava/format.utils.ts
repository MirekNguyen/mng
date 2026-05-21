export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

export const formatPace = (metersPerSecond: number, sport: string): string => {
  if (metersPerSecond === 0) return "-";

  if (sport.toLowerCase().includes("ride") || sport.toLowerCase().includes("cycling")) {
    const kmh = metersPerSecond * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  }

  const secPerKm = 1000 / metersPerSecond;
  const paceMin = Math.floor(secPerKm / 60);
  const paceSec = Math.round(secPerKm % 60);
  return `${paceMin}:${paceSec.toString().padStart(2, "0")}/km`;
};
