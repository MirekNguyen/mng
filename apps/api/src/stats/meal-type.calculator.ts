import { FoodEntry } from "@mng/database/schema/other.schema";
import { MealTypeBreakdown } from "./meal-type-breakdown.entity";

type MealTypeGroup = {
  mealType: string;
  totalCalories: number;
  entryCount: number;
};

export const MealTypeCalculator = {
  calculate(entries: FoodEntry[]): MealTypeBreakdown[] {
    const grouped: MealTypeGroup[] = [];

    for (const entry of entries) {
      const existing = grouped.find((g) => g.mealType === entry.mealType);

      if (existing) {
        existing.totalCalories += entry.calories;
        existing.entryCount += 1;
      } else {
        grouped.push({
          mealType: entry.mealType,
          totalCalories: entry.calories,
          entryCount: 1,
        });
      }
    }

    const totalCalories = grouped.reduce(
      (sum, g) => sum + g.totalCalories,
      0,
    );

    return grouped.map((g) => ({
      mealType: g.mealType,
      averageCalories: g.totalCalories / g.entryCount,
      percentage: totalCalories > 0 ? (g.totalCalories / totalCalories) * 100 : 0,
      entryCount: g.entryCount,
    }));
  },
};
