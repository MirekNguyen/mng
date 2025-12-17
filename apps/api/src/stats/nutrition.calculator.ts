import { FoodEntry } from "@mng/database/schema/other.schema";

export type DailyAverages = {
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
};

export const NutritionCalculator = {
  calculateDailyAverages(entries: FoodEntry[], dayCount: number): DailyAverages {
    const totalCalories = entries.reduce(
      (sum, entry) => sum + entry.calories,
      0,
    );
    const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);
    const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
    const totalFat = entries.reduce((sum, entry) => sum + entry.fat, 0);

    if (dayCount === 0) {
      return {
        averageCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFat: 0,
      };
    }

    return {
      averageCalories: totalCalories / dayCount,
      averageProtein: totalProtein / dayCount,
      averageCarbs: totalCarbs / dayCount,
      averageFat: totalFat / dayCount,
    };
  },
};
