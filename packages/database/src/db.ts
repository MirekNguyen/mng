import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { otherSchema } from "./schema/other.schema";
import { properties } from "./schema/properties.schema";
import { env } from "./env";

const schema = {
  properties,
  ...otherSchema,
};

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });

export * from "drizzle-orm";
