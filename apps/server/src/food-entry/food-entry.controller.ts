import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/zod.pipe';
import { FoodEntry } from 'src/database/schema/other.schema';
import * as z from 'zod';
import { FoodEntryRepository } from './food-entry.repository';

@Controller('food-entry')
export class FoodEntryController {
  constructor(private readonly foodEntryService: FoodEntryRepository) {}

  @Get()
  @UsePipes(new ZodValidationPipe(z.iso.date()))
  async getEntries(@Query('date') dateString: string): Promise<FoodEntry[]> {
    return await this.foodEntryService.getEntries(new Date(dateString));
  }
}
