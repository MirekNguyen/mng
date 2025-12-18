import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { logger } from "@mng/logger/logger";
import type { FoodEntry } from "@mng/database/schema/other.schema";

export const FoodEntrySummarizer = {
  async summarizeDay(entries: FoodEntry[]) {
    if (entries.length === 0) {
      throw new Error("No entries to summarize");
    }

    const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
    const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);
    const totalCarbs = entries.reduce((sum, e) => sum + e.carbs, 0);
    const totalFat = entries.reduce((sum, e) => sum + e.fat, 0);

    const entriesByMeal = entries.reduce(
      (acc, entry) => {
        if (!acc[entry.mealType]) {
          acc[entry.mealType] = [];
        }
        acc[entry.mealType].push(entry);
        return acc;
      },
      {} as Record<string, FoodEntry[]>,
    );

    const mealSummary = Object.entries(entriesByMeal)
      .map(([mealType, mealEntries]) => {
        const foods = mealEntries.map((e) => e.foodName).join(", ");
        const calories = mealEntries.reduce((sum, e) => sum + e.calories, 0);
        return `${mealType}: ${foods} (${Math.round(calories)} kcal)`;
      })
      .join("\n");

    const prompt = `Analyze this person's daily food intake and provide a concise, friendly summary with insights:

Total Macros:
- Calories: ${Math.round(totalCalories)} kcal
- Protein: ${Math.round(totalProtein)}g
- Carbs: ${Math.round(totalCarbs)}g
- Fat: ${Math.round(totalFat)}g

Meals:
${mealSummary}

Provide:
1. A brief overview of their eating pattern
2. Nutritional balance assessment (protein/carbs/fat ratio)
3. One actionable suggestion for improvement
4. A motivational closing

Keep it conversational, positive, and under 200 words.`;

    try {
      const result = await streamText({
        model: google("gemini-2.0-flash-exp"),
        messages: [
          {
            role: "system",
            content:
              "You are a friendly nutritionist AI assistant. Provide helpful, evidence-based nutrition insights in a warm, encouraging tone.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return result.toTextStreamResponse();
    } catch (error) {
      logger.error("AI Summary failed", error);
      throw new Error("Failed to generate daily summary");
    }
  },
};
