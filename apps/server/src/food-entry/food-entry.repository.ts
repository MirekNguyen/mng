import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import {
  DRIZZLE_PROVIDER,
  type DrizzleDatabase,
} from 'src/database/drizzle.provider';
import { FoodEntry, foodEntries } from 'src/database/schema/other.schema';

@Injectable()
export class FoodEntryRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase) {}
  async getEntries(date: Date): Promise<FoodEntry[]> {
    const dateString = DateTime.fromJSDate(date).toFormat('yyyy-M-dd');
    return await this.db.query.foodEntries.findMany({
      where: eq(foodEntries.entryDate, dateString),
    });
  }
}
