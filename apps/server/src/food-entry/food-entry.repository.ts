import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  DRIZZLE_PROVIDER,
  type DrizzleDatabase,
} from 'src/database/drizzle.provider';
import { FoodEntry, foodEntries } from 'src/database/schema/other.schema';

@Injectable()
export class FoodEntryRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase) {}
  async getEntries(date: Date): Promise<FoodEntry[]> {
    const dateString = date.toISOString().slice(0, 10);
    return await this.db.query.foodEntries.findMany({
      where: eq(foodEntries.entryDate, dateString),
    });
  }
}
