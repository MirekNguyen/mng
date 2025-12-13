import { db, eq } from "@mng/database/db";
import {
  CreateFoodEntry,
  foodEntries,
  FoodEntry,
  UpdateFoodEntry,
} from "@mng/database/schema/other.schema";

export const FoodEntryRepository = {
  async get(date: Date): Promise<FoodEntry[]> {
    const dateString = DateTime.fromJSDate(date).toFormat("yyyy-M-dd");
    return await db.query.foodEntries.findMany({
      where: eq(foodEntries.entryDate, dateString),
    });
  },

  async create(foodEntry: CreateFoodEntry): Promise<FoodEntry> {
    const created = (
      await db.insert(foodEntries).values(foodEntry).returning()
    )[0];
    if (!created) {
      throw new Error("Failed to create food entry");
    }
    return created;
  },

  async update(id: number, foodEntry: UpdateFoodEntry): Promise<FoodEntry> {
    const updated = (
      await db
        .update(foodEntries)
        .set(foodEntry)
        .where(eq(foodEntries.id, id))
        .returning()
    )[0];
    if (!updated) {
      throw new NotFoundException(`Food entry not found for update`);
    }
    return updated;
  },

  async delete(id: number): Promise<FoodEntry> {
    const deleted = (
      await db.delete(foodEntries).where(eq(foodEntries.id, id)).returning()
    )[0];
    if (!deleted) {
      throw new Error(`Food entry with id ${id} not found`);
    }
    return deleted;
  },
};
