import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { env } from "@mng/database/env";
import { logger } from "@mng/logger/logger";

export const FoodAnalysisSchema = z.object({
  name: z.string().describe("The common name of the food or meal."),
  calories: z.number().describe("Estimated total calories in kcal."),
  protein: z.number().describe("Estimated total protein in grams."),
  carbs: z.number().describe("Estimated total carbohydrates in grams."),
  fats: z.number().describe("Estimated total fats in grams."),
  amount: z.number().describe("The quantity of the food."),
  unit: z
    .enum(["serving", "g", "ml", "oz", "cup", "tbsp", "tsp", "pcs"])
    .describe("The unit of measurement for the amount."),
});

export type FoodAnalysisResult = z.infer<typeof FoodAnalysisSchema>;

export const FoodEntryAnalyzer = {
  async analyze(files: File[]): Promise<FoodAnalysisResult> {
    if (files.length === 0) {
      throw new Error("No files provided for analysis");
    }

    const imageContent = await Promise.all(
      files.map(async (file) => ({
        type: "image" as const,
        image: await file.arrayBuffer(),
        mimeType: file.type,
      })),
    );

    try {
      const { object: result } = await generateObject({
        model: openai(env.OPENAI_MODEL),
        schema: FoodAnalysisSchema,
        messages: [
          {
            role: "system",
            content:
              "You are an expert nutritionist AI. Analyze the food images and return structured nutritional data.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify this meal and estimate its nutritional content. If multiple images are provided, combine them for a single accurate estimate. Harmonize any discrepancies.",
              },
              ...imageContent,
            ],
          },
        ],
      });

      return result;
    } catch (error) {
      logger.error("AI Analysis failed");
      logger.error(error);
      throw new Error("Failed to analyze food images");
    }
  },
};
