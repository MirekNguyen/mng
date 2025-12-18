import z from "zod";

export const dbSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    message: "Must be a valid postgres connection string",
  }),
});

export const envSchema = dbSchema.extend({
  OPENAI_MODEL: z.string().min(1),
});

