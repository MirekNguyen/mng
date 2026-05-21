import { betterAuth } from "better-auth";
import { genericOAuth, admin } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, eq } from "@mng/database/db";
import { allowedUsers } from "@mng/database/schema/auth.schema";
import { StravaRepository } from "./strava/strava.repository";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;
const API_URL = process.env.API_URL ?? "http://localhost:3000";
const APP_URL = process.env.APP_URL ?? "http://localhost:3001";

export const auth = betterAuth({
  baseURL: API_URL,
  basePath: "/api/auth",
  trustedOrigins: [APP_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: "localhost",
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: false,
      path: "/",
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: `${API_URL}/api/auth/callback/github`,
      scope: ["user:email", "read:user"],
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.id}@github.user`,
      }),
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
      trustedProviders: ["github", "strava"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email;
          if (!email) throw new APIError("FORBIDDEN", { message: "Access denied" });

          // Check allowlist: match by exact email or pattern (e.g. *@github.user won't match unless explicitly added)
          const allowed = await db.select().from(allowedUsers).where(eq(allowedUsers.identifier, email)).limit(1);
          if (allowed.length === 0) {
            throw new APIError("FORBIDDEN", { message: "You are not on the allowlist. Contact the admin for access." });
          }
        },
      },
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "strava",
          clientId: STRAVA_CLIENT_ID,
          clientSecret: STRAVA_CLIENT_SECRET,
          authorizationUrl: "https://www.strava.com/oauth/authorize",
          tokenUrl: "https://www.strava.com/oauth/token",
          scopes: ["read", "activity:read_all", "profile:read_all"],
          redirectURI: `${API_URL}/api/auth/callback/strava`,
          getUserInfo: async (tokens) => {
            const response = await fetch("https://www.strava.com/api/v3/athlete", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            const athlete = await response.json();

            // Upsert into strava_athletes table for activity sync
            await StravaRepository.upsertAthlete({
              stravaId: athlete.id,
              firstName: athlete.firstname,
              lastName: athlete.lastname,
              profileImageUrl: athlete.profile,
              city: athlete.city,
              country: athlete.country,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken ?? "",
              tokenExpiresAt: tokens.accessTokenExpiresAt
                ? Math.floor(tokens.accessTokenExpiresAt.getTime() / 1000)
                : Math.floor(Date.now() / 1000) + 21600,
            });

            return {
              id: String(athlete.id),
              name: `${athlete.firstname} ${athlete.lastname}`,
              email: `${athlete.id}@strava.athlete`,
              image: athlete.profile,
              emailVerified: true,
            };
          },
        },
      ],
    }),
    admin(),
  ],
});
