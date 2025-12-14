import { db, eq } from "@mng/database/db";
import {
  createFoodEntrySchema,
  foodEntries,
  FoodEntry,
  updateFoodEntrySchema,
} from "@mng/database/schema/other.schema";
import Elysia from "elysia";
import z from "zod";
import { FoodEntryRepository } from "./food-entry.repository";

const app = new Elysia({ prefix: "food-entry" });

app.get(
  "/",
  async ({ query }): Promise<FoodEntry[]> => {
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
  "/",
  async ({ body }): Promise<FoodEntry> => {
    return (await db.insert(foodEntries).values(body).returning())[0];
  },
  {
    body: createFoodEntrySchema,
  },
);

app.patch(
  "/:id",
  async ({ query, params }): Promise<FoodEntry> => {
    return FoodEntryRepository.update(params.id, query);
  },
  {
    query: updateFoodEntrySchema,
    params: z.object({ id: z.number().positive() }),
  },
);

app.delete(
  "/:id",
  async ({ params }): Promise<FoodEntry> => {
    return FoodEntryRepository.delete(params.id);
  },
  {
    params: z.object({ id: z.number().positive() }),
  },
);

export { app as foodEntryController };
