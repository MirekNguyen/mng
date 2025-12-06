import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    message: "Must be a valid postgres connection string",
  }),
});
export const env = envSchema.parse(Bun.env);
