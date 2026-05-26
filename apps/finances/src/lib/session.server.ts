import { getCookie } from "@tanstack/react-start/server";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export type SessionData = {
  userId: string;
  userName: string;
  userImage: string | undefined;
};

export const getSession = async (): Promise<SessionData | null> => {
  const tokenPlain = getCookie("better-auth.session_token");
  const tokenSecure = getCookie("__Secure-better-auth.session_token");
  const token = tokenPlain ?? tokenSecure;
  if (!token) return null;

  const cookieName = tokenPlain ? "better-auth.session_token" : "__Secure-better-auth.session_token";
  const response = await fetch(`${API_URL}/api/me`, {
    headers: {
      cookie: `${cookieName}=${token}`,
    },
  });

  if (!response.ok) return null;

  const result = await response.json();
  if (!result?.user) return null;

  return {
    userId: result.user.id,
    userName: result.user.name,
    userImage: result.user.image ?? undefined,
  };
};
