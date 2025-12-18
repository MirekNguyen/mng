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
import { FoodEntrySummarizer } from "./food-entry.summarizer";
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

app.get(
  "/summarize",
  async ({ query, set }) => {
    const dateString = query.date.toISOString().split("T")[0];
    const entries = await db.query.foodEntries.findMany({
      where: eq(foodEntries.entryDate, dateString),
    });

    if (entries.length === 0) {
      throw new ServerError("No entries found for this date");
    }

    const stream = await FoodEntrySummarizer.summarizeDay(entries);
    set.headers["Content-Type"] = "text/event-stream";
    set.headers["Cache-Control"] = "no-cache";
    set.headers["Connection"] = "keep-alive";
    
    return stream;
  },
  {
    query: z.object({ date: z.coerce.date() }),
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
