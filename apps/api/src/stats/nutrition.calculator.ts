import { FoodEntry } from "@mng/database/schema/other.schema";

export type NutritionTotals = {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  averageCaloriesPerDay: number;
};

export const NutritionCalculator = {
  calculateTotals(entries: FoodEntry[], dayCount: number): NutritionTotals {
    const totalCalories = entries.reduce(
      (sum, entry) => sum + entry.calories,
      0,
    );
    const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);
    const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
    const totalFat = entries.reduce((sum, entry) => sum + entry.fat, 0);

    const averageCaloriesPerDay =
      dayCount > 0 ? totalCalories / dayCount : 0;

    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      averageCaloriesPerDay,
    };
  },
};
