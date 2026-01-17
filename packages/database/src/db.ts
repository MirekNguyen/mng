import { otherSchema } from "./schema/other.schema";
import { properties } from "./schema/properties.schema";
import { env } from "./env";
import { drizzle } from "drizzle-orm/bun-sql";

const schema = {
  properties,
  ...otherSchema,
};

export const db = drizzle(env.DATABASE_URL, { schema });

export * from "drizzle-orm";
