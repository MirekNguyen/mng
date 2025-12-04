import * as z from "zod";

export const EnvSchema = z.object({
  DATABASE_URL: z.string("Database URL is required").min(3),
});
