import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { ICrudRepository } from 'src/common/icrud.controller';
import {
  DRIZZLE_PROVIDER,
  type DrizzleDatabase,
} from 'src/database/drizzle.provider';
import {
  CreateFoodEntry,
  FoodEntry,
  foodEntries,
  UpdateFoodEntry,
} from 'src/database/schema/other.schema';

@Injectable()
export class FoodEntryRepository implements ICrudRepository<FoodEntry> {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase) {}
  async get(date: Date): Promise<FoodEntry[]> {
    const dateString = DateTime.fromJSDate(date).toFormat('yyyy-M-dd');
    return await this.db.query.foodEntries.findMany({
      where: eq(foodEntries.entryDate, dateString),
    });
  }

  async create(foodEntry: CreateFoodEntry): Promise<FoodEntry> {
    const created = (
      await this.db.insert(foodEntries).values(foodEntry).returning()
    )[0];
    if (!created) {
      throw new InternalServerErrorException('Failed to create food entry');
    }
    return created;
  }

  async update(
    id: number,
    foodEntry: UpdateFoodEntry,
  ): Promise<FoodEntry> {
    const updated = (
      await this.db
        .update(foodEntries)
        .set(foodEntry)
        .where(eq(foodEntries.id, id))
        .returning()
    )[0];
    if (!updated) {
      throw new NotFoundException(`Food entry not found for update`);
    }
    return updated;
  }

  async delete(id: number): Promise<FoodEntry> {
    const deleted = (
      await this.db
        .delete(foodEntries)
        .where(eq(foodEntries.id, id))
        .returning()
    )[0];
    if (!deleted) {
      throw new NotFoundException(`Food entry with id ${id} not found`);
    }
    return deleted;
  }
}
