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
} from "@nestjs/common";
import * as z from "zod";
import { FoodEntryRepository } from "./food-entry.repository";
import { FilesInterceptor } from "@nest-lab/fastify-multer";
import { FoodEntryAnalyzer, FoodEntryType } from "./food-entry.analyzer";
import { ZodValidationPipe } from "@/common/zod.pipe";
import { ICrudController } from "@/common/icrud.controller";
import {
  CreateFoodEntry,
  createFoodEntrySchema,
  FoodEntry,
  UpdateFoodEntry,
  updateFoodEntrySchema,
} from "@/database/schema/other.schema";

@Controller("food-entry")
export class FoodEntryController implements ICrudController<FoodEntry> {
  constructor(
    private readonly repository: FoodEntryRepository,
    private readonly foodEntryAnalyzer: FoodEntryAnalyzer,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(z.iso.date()))
  async get(@Query("date") dateString: string): Promise<FoodEntry[]> {
    return await this.repository.get(new Date(dateString));
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createFoodEntrySchema))
  async create(@Body() foodEntry: CreateFoodEntry): Promise<FoodEntry> {
    return await this.repository.create(foodEntry);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateFoodEntrySchema))
    foodEntry: UpdateFoodEntry,
  ): Promise<FoodEntry> {
    return await this.repository.update(id, foodEntry);
  }

  @Delete(":id") async delete(@Param("id", ParseIntPipe) id: number): Promise<FoodEntry> {
    return await this.repository.delete(id);
  }

  @Post("analyze")
  @UseInterceptors(FilesInterceptor("images", 5))
  async analyze(@UploadedFiles() files: Express.Multer.File[]): Promise<FoodEntryType | null> {
    return await this.foodEntryAnalyzer.analyze(files);
  }
}
