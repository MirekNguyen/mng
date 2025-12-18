import { envSchema } from "./env.zodschema";

export const env = envSchema.parse(process.env);
