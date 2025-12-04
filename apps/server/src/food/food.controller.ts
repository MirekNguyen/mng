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
} from "@nestjs/common";
import { FoodRepository } from "./food.repository";
import { CreateFood,
createFoodSchema,
Food, 
UpdateFood, 
updateFoodSchema} from "@/database/schema/other.schema";
import { ZodValidationPipe } from "@/common/zod.pipe";

@Controller("food")
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

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateFoodSchema))
    foodEntry: UpdateFood,
  ): Promise<Food> {
    return await this.repository.update(id, foodEntry);
  }

  @Delete(":id") async delete(@Param("id", ParseIntPipe) id: number): Promise<Food> {
    return await this.repository.delete(id);
  }
}
