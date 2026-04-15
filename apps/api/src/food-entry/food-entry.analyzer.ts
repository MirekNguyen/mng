import { generateObject } from "ai";
import { z } from "zod";
import { logger } from "@mng/logger/logger";
import { google } from "@ai-sdk/google";

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
  async analyze(files: File[], prompt?: string): Promise<FoodAnalysisResult> {
    if (files.length === 0 && !prompt?.trim()) {
      throw new Error("No files or prompt provided for analysis");
    }

    const imageContent = await Promise.all(
      files.map(async (file) => ({
        type: "image" as const,
        image: await file.arrayBuffer(),
        mimeType: file.type,
      })),
    );

    const hasImages = imageContent.length > 0;
    const hasPrompt = !!prompt?.trim();

    const userTextContent = buildUserText(hasImages, hasPrompt, prompt);

    try {
      const { object: result } = await generateObject({
        model: google("gemini-2.0-flash-exp"),
        schema: FoodAnalysisSchema,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(hasImages, hasPrompt),
          },
          {
            role: "user",
            content: hasImages
              ? [{ type: "text" as const, text: userTextContent }, ...imageContent]
              : userTextContent,
          },
        ],
      });

      return result;
    } catch (error) {
      logger.error("AI Analysis failed");
      logger.error(error);
      throw new Error("Failed to analyze food");
    }
  },

  async analyzeWithProgress(
    files: File[],
    prompt: string | undefined,
    onProgress: (message: string) => void,
  ): Promise<FoodAnalysisResult> {
    if (files.length === 0 && !prompt?.trim()) {
      throw new Error("No files or prompt provided for analysis");
    }

    onProgress("Processing input...");

    const imageContent = await Promise.all(
      files.map(async (file) => ({
        type: "image" as const,
        image: await file.arrayBuffer(),
        mimeType: file.type,
      })),
    );

    const hasImages = imageContent.length > 0;
    const hasPrompt = !!prompt?.trim();

    onProgress("Analyzing food with AI...");

    const userTextContent = buildUserText(hasImages, hasPrompt, prompt);

    try {
      const { object: result } = await generateObject({
        model: google("gemini-2.0-flash-exp"),
        schema: FoodAnalysisSchema,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(hasImages, hasPrompt),
          },
          {
            role: "user",
            content: hasImages
              ? [{ type: "text" as const, text: userTextContent }, ...imageContent]
              : userTextContent,
          },
        ],
      });

      onProgress("Analysis complete!");
      return result;
    } catch (error) {
      logger.error("AI Analysis failed");
      logger.error(error);
      throw new Error("Failed to analyze food");
    }
  },
};

function buildSystemPrompt(hasImages: boolean, hasPrompt: boolean): string {
  if (hasImages && hasPrompt) {
    return (
      "You are a food entry analyzer. The user has provided both images of a meal and a text description. " +
      "Use BOTH the images and the description together for the most accurate nutritional analysis. " +
      "The text description may clarify meal identity, portion size, or ingredients not visible in the images. " +
      "Return a single, harmonized JSON object with nutritional information. Never output anything but the JSON."
    );
  }
  if (hasImages) {
    return (
      "You are a food entry analyzer. Analyze the provided images of a meal and return a single, harmonized JSON object with the nutritional information. " +
      "Never output anything but the JSON. No explanation."
    );
  }
  // Text-only
  return (
    "You are a food entry analyzer. The user has described their meal in text. " +
    "Use the description to estimate nutritional information using up-to-date nutrition databases. " +
    "Return a single JSON object with the nutritional breakdown. Never output anything but the JSON. No explanation."
  );
}

function buildUserText(hasImages: boolean, hasPrompt: boolean, prompt?: string): string {
  if (hasImages && hasPrompt) {
    return (
      `User description: "${prompt}"\n\n` +
      "Analyze ALL these images of the SAME meal jointly, taking the user's description into account for better accuracy. " +
      "Use visual recognition, portion estimation (consider known object sizes for scale), AND if visible, any nutrition facts, ingredients lists, manufacturer stickers, or packaging. " +
      "Prefer label/panel info if visible, otherwise estimate using up-to-date, regionally appropriate nutrition databases. " +
      "Harmonize your answer across image evidence and the user description. " +
      "Output a single JSON object. Don't guess if not plausible."
    );
  }
  if (hasImages) {
    return (
      "Analyze ALL these images of the SAME meal jointly for better accuracy. " +
      "Use visual recognition, portion estimation (consider known object sizes for scale), AND if visible, any nutrition facts, ingredients lists, manufacturer stickers, or packaging for nutritional values. " +
      "Prefer label/panel info if visible, otherwise estimate using up-to-date, regionally appropriate nutrition databases. " +
      "Harmonize your answer if there are discrepancies. " +
      "Output a single JSON object. Don't guess if not plausible."
    );
  }
  // Text-only
  return (
    `The user described their meal as: "${prompt}"\n\n` +
    "Estimate the nutritional information for this meal using up-to-date, regionally appropriate nutrition databases. " +
    "Infer realistic portion sizes if not specified. " +
    "Output a single JSON object. Don't guess if not plausible."
  );
}
