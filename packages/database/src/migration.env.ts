import { dbSchema } from "./env.zodschema";

export const migrationEnv = dbSchema.parse(process.env);
