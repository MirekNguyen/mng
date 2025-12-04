import { Config, defineConfig } from "drizzle-kit";
import { EnvSchema } from "src/database/env.resolver";

const env = EnvSchema.parse(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/database/schema/*.schema.ts"],
  out: "./migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: false,
  strict: true,
}) satisfies Config;
