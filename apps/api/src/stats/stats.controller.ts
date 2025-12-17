import Elysia from "elysia";
import z from "zod";
import { DateTime } from "luxon";
import { StatsRepository } from "./stats.repository";
import { NutritionCalculator } from "./nutrition.calculator";
import { DailyBreakdownCalculator } from "./daily-breakdown.calculator";
import { MealTypeCalculator } from "./meal-type.calculator";
import { DailyBreakdown } from "./daily-breakdown.entity";
import { MealTypeBreakdown } from "./meal-type-breakdown.entity";

export type StatsResponse = {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  averageCaloriesPerDay: number;
  entryCount: number;
  dailyBreakdown: DailyBreakdown[];
  mealTypeBreakdown: MealTypeBreakdown[];
};

const app = new Elysia({ prefix: "stats" });

app.get(
  "/",
  async ({ query }): Promise<StatsResponse> => {
    const startDate = DateTime.fromJSDate(query.startDate).toFormat(
      "yyyy-M-dd",
    );
    const endDate = DateTime.fromJSDate(query.endDate).toFormat("yyyy-M-dd");

    const entries = await StatsRepository.getFoodEntriesByDateRange(
      startDate,
      endDate,
    );

    const dayCount =
      DateTime.fromISO(endDate).diff(DateTime.fromISO(startDate), "days").days +
      1;

    const nutritionTotals = NutritionCalculator.calculateTotals(
      entries,
      dayCount,
    );
    const dailyBreakdown = DailyBreakdownCalculator.calculate(entries);
    const mealTypeBreakdown = MealTypeCalculator.calculate(entries);

    return {
      ...nutritionTotals,
      entryCount: entries.length,
      dailyBreakdown,
      mealTypeBreakdown,
    };
  },
  {
    query: z.object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    }),
  },
);

export { app as statsController };
