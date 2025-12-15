import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    message: "Must be a valid postgres connection string",
  }),
  OPENAI_MODEL: z.string().min(1)
});
export const env = envSchema.parse(Bun.env);
