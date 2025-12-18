import { Config, defineConfig } from "drizzle-kit";
import { migrationEnv } from "./src/env";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/**/*.schema.ts"],
  out: "./migrations",
  dbCredentials: {
    url: migrationEnv.DATABASE_URL,
  },
  verbose: false,
  strict: true,
}) satisfies Config;
