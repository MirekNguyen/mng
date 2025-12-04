import { Module } from "@nestjs/common";
import { FoodEntryController } from "./food-entry.controller";
import { FoodEntryRepository } from "./food-entry.repository";
import { FoodEntryAnalyzer } from "./food-entry.analyzer";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [FoodEntryRepository, FoodEntryAnalyzer],
  controllers: [FoodEntryController],
})
export class FoodEntryModule {}
