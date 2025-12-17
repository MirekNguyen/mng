import { FoodEntry } from "@mng/database/schema/other.schema";
import { MealTypeBreakdown } from "./meal-type-breakdown.entity";

export const MealTypeCalculator = {
  calculate(entries: FoodEntry[]): MealTypeBreakdown[] {
    const grouped: MealTypeBreakdown[] = [];

    for (const entry of entries) {
      const existing = grouped.find((g) => g.mealType === entry.mealType);

      if (existing) {
        existing.calories += entry.calories;
        existing.entryCount += 1;
      } else {
        grouped.push({
          mealType: entry.mealType,
          calories: entry.calories,
          entryCount: 1,
        });
      }
    }

    return grouped;
  },
};
