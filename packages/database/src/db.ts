import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";
import { properties } from "./schema/properties.schema";

const schema = {
  properties,
};

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });

export * from "drizzle-orm";
