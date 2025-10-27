import { Controller, Get, Query } from '@nestjs/common';
import { FoodEntry } from 'src/database/schema/other.schema';
import { FoodEntryRepository } from './food-entry.repository';

@Controller('food-entry')
export class FoodEntryController {
  constructor(private readonly foodEntryService: FoodEntryRepository) {}

  @Get()
  async getEntries(@Query('date') dateString: string): Promise<FoodEntry[]> {
    const date = new Date(dateString);
    return await this.foodEntryService.getEntries(date);
  }
}
