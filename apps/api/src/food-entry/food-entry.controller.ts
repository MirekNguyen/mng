import { db, eq } from "@mng/database/db";
import {
  createFoodEntrySchema,
  foodEntries,
  FoodEntry,
  updateFoodEntrySchema,
} from "@mng/database/schema/other.schema";
import Elysia, { t } from "elysia";
import z from "zod";
import { FoodEntryRepository } from "./food-entry.repository";
import { FoodAnalysisResult, FoodEntryAnalyzer } from "./food-entry.analyzer";
import { ServerError } from "@mng/http/server.error";

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

app.post(
  "/analyze",
  async ({ body, set }): Promise<FoodAnalysisResult> => {
    if (!body.files.length) {
      throw new ServerError("At least one image file is required.");
    }

    // Use the new method with progress callback
    return await FoodEntryAnalyzer.analyzeWithProgress(
      body.files,
      (message) => {
        // Log progress messages on the server
        console.log(`[Analysis Progress] ${message}`);
      }
    );
  },
  {
    body: t.Object({
      files: t.Files({
        type: ["image/jpeg", "image/png", "image/webp"],
        maxSize: "10m",
        minItems: 1,
      }),
    }),
  },
);

app.patch(
  "/:id",
  async ({ query, params }): Promise<FoodEntry> => {
    return FoodEntryRepository.update(params.id, query);
  },
  {
    query: updateFoodEntrySchema,
    params: z.object({ id: z.coerce.number().positive() }),
  },
);

app.delete(
  "/:id",
  async ({ params }): Promise<FoodEntry> => {
    return FoodEntryRepository.delete(params.id);
  },
  {
    params: z.object({ id: z.coerce.number().positive() }),
  },
);

export { app as foodEntryController };
