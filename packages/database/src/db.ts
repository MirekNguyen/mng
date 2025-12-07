import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "./env";
import { properties } from "./schema/properties.schema";
import { otherSchema } from "./schema/other.schema";
import postgres from "postgres";

const schema = {
  properties,
  ...otherSchema,
};

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });

export * from "drizzle-orm";
