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
  UploadedFiles,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ICrudController } from 'src/common/icrud.controller';
import { ZodValidationPipe } from 'src/common/zod.pipe';
import {
  type CreateFoodEntry,
  createFoodEntrySchema,
  FoodEntry,
  type UpdateFoodEntry,
  updateFoodEntrySchema,
} from 'src/database/schema/other.schema';
import * as z from 'zod';
import { FoodEntryRepository } from './food-entry.repository';
import { FilesInterceptor } from '@nest-lab/fastify-multer';
import { FoodEntryAnalyzer } from './food-entry.analyzer';

@Controller('food-entry')
export class FoodEntryController implements ICrudController<FoodEntry> {
  constructor(
    private readonly repository: FoodEntryRepository,
    private readonly foodEntryAnalyzer: FoodEntryAnalyzer,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(z.iso.date()))
  async get(@Query('date') dateString: string): Promise<FoodEntry[]> {
    return await this.repository.get(new Date(dateString));
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createFoodEntrySchema))
  async create(@Body() foodEntry: CreateFoodEntry): Promise<FoodEntry> {
    return await this.repository.create(foodEntry);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateFoodEntrySchema))
    foodEntry: UpdateFoodEntry,
  ): Promise<FoodEntry> {
    return await this.repository.update(id, foodEntry);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<FoodEntry> {
    return await this.repository.delete(id);
  }

  @Post('analyze')
  @UseInterceptors(FilesInterceptor('images', 5))
  async analyze(@UploadedFiles() files: Express.Multer.File[]) {
    return await this.foodEntryAnalyzer.analyze(files);
  }
}
