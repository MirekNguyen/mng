import { getCookie, getRequestHeaders } from "@tanstack/react-start/server";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export type SessionData = {
  userId: string;
  athleteStravaId: number;
  athleteName: string;
  athleteImage: string | undefined;
  stravaConnected: boolean;
};

export type SessionResult =
  | { authenticated: false }
  | { authenticated: true; stravaConnected: false; userName: string; userImage: string | undefined }
  | { authenticated: true; stravaConnected: true; data: SessionData };

export const getSessionResult = async (): Promise<SessionResult> => {
  const headers = getRequestHeaders();
  console.log("[session] raw cookie header:", headers?.cookie ?? "NONE");
  const tokenPlain = getCookie("better-auth.session_token");
  const tokenSecure = getCookie("__Secure-better-auth.session_token");
  const token = tokenPlain ?? tokenSecure;
  console.log("[session] cookies:", { tokenPlain: !!tokenPlain, tokenSecure: !!tokenSecure });
  if (!token) return { authenticated: false };

  const cookieName = tokenPlain ? "better-auth.session_token" : "__Secure-better-auth.session_token";
  const response = await fetch(`${API_URL}/api/me`, {
    headers: {
      cookie: `${cookieName}=${token}`,
    },
  });

  console.log("[session] /api/me status:", response.status);
  if (!response.ok) return { authenticated: false };

  const result = await response.json();
  if (!result?.user) return { authenticated: false };

  if (!result.stravaConnected) {
    return {
      authenticated: true,
      stravaConnected: false,
      userName: result.user.name,
      userImage: result.user.image ?? undefined,
    };
  }

  return {
    authenticated: true,
    stravaConnected: true,
    data: {
      userId: result.user.id,
      athleteStravaId: result.stravaAthleteId,
      athleteName: result.user.name,
      athleteImage: result.user.image ?? undefined,
      stravaConnected: true,
    },
  };
};

// Backward-compatible helper: returns SessionData or null (only if fully connected)
// Throws redirect if authenticated but no Strava (for use in route guards)
export const getSession = async (): Promise<SessionData | null> => {
  const result = await getSessionResult();
  if (!result.authenticated) return null;
  if (!result.stravaConnected) return null;
  return result.data;
};
