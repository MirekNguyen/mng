import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/zod.pipe';
import {
  type CreateFoodEntry,
  insertFoodEntrySchema as createFoodEntrySchema,
  FoodEntry,
  type UpdateFoodEntry,
  updateFoodEntrySchema,
} from 'src/database/schema/other.schema';
import * as z from 'zod';
import { FoodEntryRepository } from './food-entry.repository';
import { ICrudController } from 'src/common/icrud.controller';

@Controller('food-entry')
export class FoodEntryController implements ICrudController<FoodEntry> {
  constructor(private readonly foodEntryService: FoodEntryRepository) {}

  @Get()
  @UsePipes(new ZodValidationPipe(z.iso.date()))
  async get(@Query('date') dateString: string): Promise<FoodEntry[]> {
    return await this.foodEntryService.getEntries(new Date(dateString));
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createFoodEntrySchema))
  async create(@Body() foodEntry: CreateFoodEntry): Promise<FoodEntry> {
    return await this.foodEntryService.createEntry(foodEntry);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateFoodEntrySchema)) foodEntry: UpdateFoodEntry,
  ): Promise<FoodEntry> {
    return await this.foodEntryService.updateEntry(id, foodEntry);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<FoodEntry> {
    return await this.foodEntryService.deleteEntry(id);
  }
}
