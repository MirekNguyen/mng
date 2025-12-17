import { FoodEntry } from "@mng/database/schema/other.schema";
import { DailyBreakdown } from "./daily-breakdown.entity";

export const DailyBreakdownCalculator = {
  calculate(entries: FoodEntry[]): DailyBreakdown[] {
    const grouped: DailyBreakdown[] = [];

    for (const entry of entries) {
      const existing = grouped.find((g) => g.date === entry.entryDate);

      if (existing) {
        existing.calories += entry.calories;
        existing.protein += entry.protein;
        existing.carbs += entry.carbs;
        existing.fat += entry.fat;
        existing.entryCount += 1;
      } else {
        grouped.push({
          date: entry.entryDate,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          entryCount: 1,
        });
      }
    }

    return grouped.sort((a, b) => a.date.localeCompare(b.date));
  },
};
