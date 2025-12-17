import { db, and, gte, lte } from "@mng/database/db";
import { foodEntries, FoodEntry } from "@mng/database/schema/other.schema";

export const StatsRepository = {
  async getFoodEntriesByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<FoodEntry[]> {
    return await db.query.foodEntries.findMany({
      where: and(
        gte(foodEntries.entryDate, startDate),
        lte(foodEntries.entryDate, endDate),
      ),
    });
  },
};
