import z from "zod";

const dbSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    message: "Must be a valid postgres connection string",
  }),
});

const envSchema = dbSchema.extend({
  OPENAI_MODEL: z.string().min(1),
});

export const migrationEnv = dbSchema.parse(process.env);
export const env = envSchema.parse(process.env);
