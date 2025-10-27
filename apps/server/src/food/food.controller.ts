import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/zod.pipe';
import {
  type CreateFood,
  createFoodSchema,
  Food,
  type UpdateFood,
  updateFoodSchema,
} from 'src/database/schema/other.schema';
import { FoodRepository } from './food.repository';

@Controller('food')
export class FoodController {
  constructor(private readonly repository: FoodRepository) {}

  @Get()
  async getAll(): Promise<Food[]> {
    return await this.repository.getAll();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createFoodSchema))
  async create(@Body() food: CreateFood): Promise<Food> {
    return await this.repository.create(food);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateFoodSchema))
    foodEntry: UpdateFood,
  ): Promise<Food> {
    return await this.repository.update(id, foodEntry);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<FoodEntry> {
    return await this.repository.delete(id);
  }
}
