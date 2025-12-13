import { db, eq } from "@mng/database/db";
import {
  createFoodEntrySchema,
  foodEntries,
} from "@mng/database/schema/other.schema";
import Elysia from "elysia";
import z from "zod";

const app = new Elysia({ prefix: "food-entry" });

app.get(
  "food-entry",
  async ({ query }) => {
    const dateString = query.date.toISOString().split("T")[0];
    return await db.query.foodEntries.findMany({
      where: eq(foodEntries.entryDate, dateString),
    });
  },
  {
    query: z.object({ date: z.coerce.date() }),
  },
);

app.post(
  "food-entry",
  async ({ body }) => {
    return (await db.insert(foodEntries).values(body).returning())[0];
  },
  {
    body: createFoodEntrySchema,
  },
);

export { app as foodEntryController };
