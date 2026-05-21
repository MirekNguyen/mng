import { otherSchema } from "./schema/other.schema";
import { properties } from "./schema/properties.schema";
import { rssSchema } from "./schema/rss.schema";
import { stravaSchema } from "./schema/strava.schema";
import { authSchema } from "./schema/auth.schema";
import { dbSchema } from "./env.zodschema";
import { drizzle } from "drizzle-orm/bun-sql";

const schema = {
  properties,
  ...otherSchema,
  ...rssSchema,
  ...stravaSchema,
  ...authSchema,
};

const dbEnv = dbSchema.parse(process.env);
export const db = drizzle(dbEnv.DATABASE_URL, { schema });

export * from "drizzle-orm";
