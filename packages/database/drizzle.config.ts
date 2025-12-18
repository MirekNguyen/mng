import { Config, defineConfig } from "drizzle-kit";
import { env } from "./src/env";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/**/*.schema.ts"],
  out: "./migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: false,
  strict: true,
}) satisfies Config;
