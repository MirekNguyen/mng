const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const api = {
  async auth(code: string) {
    const res = await fetch(`${API_BASE}/strava/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return res.json();
  },

  async sync(athleteStravaId: number) {
    const res = await fetch(`${API_BASE}/strava/sync/${athleteStravaId}`, { method: "POST" });
    return res.json();
  },

  async syncRecent(athleteStravaId: number) {
    const res = await fetch(`${API_BASE}/strava/sync-recent/${athleteStravaId}`, { method: "POST" });
    return res.json();
  },

  async getActivities(athleteStravaId: number, limit = 50, offset = 0) {
    const res = await fetch(`${API_BASE}/strava/activities/${athleteStravaId}?limit=${limit}&offset=${offset}`);
    return res.json();
  },

  async getActivity(athleteStravaId: number, activityStravaId: number) {
    const res = await fetch(`${API_BASE}/strava/activities/${athleteStravaId}/${activityStravaId}`);
    return res.json();
  },

  async getStreams(activityStravaId: number) {
    const res = await fetch(`${API_BASE}/strava/streams/${activityStravaId}`);
    return res.json();
  },

  async getRecords(athleteStravaId: number) {
    const res = await fetch(`${API_BASE}/strava/records/${athleteStravaId}`);
    return res.json();
  },

  async getAthlete(athleteStravaId: number) {
    const res = await fetch(`${API_BASE}/strava/athlete/${athleteStravaId}`);
    return res.json();
  },

  async getFitness(athleteStravaId: number, days = 90) {
    const res = await fetch(`${API_BASE}/strava/analytics/fitness/${athleteStravaId}?days=${days}`);
    return res.json();
  },

  async getVolume(athleteStravaId: number, months = 6) {
    const res = await fetch(`${API_BASE}/strava/analytics/volume/${athleteStravaId}?months=${months}`);
    return res.json();
  },

  async getZones(athleteStravaId: number, months = 3) {
    const res = await fetch(`${API_BASE}/strava/analytics/zones/${athleteStravaId}?months=${months}`);
    return res.json();
  },

  async getPredictions(athleteStravaId: number) {
    const res = await fetch(`${API_BASE}/strava/analytics/predictions/${athleteStravaId}`);
    return res.json();
  },

  async getWorkoutAnalysis(athleteStravaId: number, activityStravaId: number) {
    const res = await fetch(`${API_BASE}/strava/analytics/workout-analysis/${athleteStravaId}/${activityStravaId}`);
    return res.json();
  },

  getWeeklyBriefUrl(athleteStravaId: number) {
    return `${API_BASE}/strava/analytics/weekly-brief/${athleteStravaId}`;
  },

  getAiPredictionsUrl(athleteStravaId: number) {
    return `${API_BASE}/strava/analytics/ai-predictions/${athleteStravaId}`;
  },
};
