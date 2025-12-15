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
              "You are a food entry analyzer. Analyze the provided images of a meal and return a single, harmonized JSON object with the nutritional information. " +
              "Never output anything but the JSON. No explanation.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:                 "Analyze ALL these images of the SAME meal jointly for better accuracy. " +
                "Use visual recognition, portion estimation (consider known object sizes for scale), AND if visible, any nutrition facts, ingredients lists, manufacturer stickers, or packaging for nutritional values. " +
                "Prefer label/panel info if visible, otherwise estimate using up-to-date, regionally appropriate nutrition databases. " +
                "Harmonize your answer if there are discrepancies. " +
                "Output a single JSON object. Don't guess if not plausible.",

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
