import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { FoodEntryController } from './food-entry.controller';
import { FoodEntryRepository } from './food-entry.repository';
import { FoodEntryAnalyzer } from './food-entry.analyzer';

@Module({
  imports: [DatabaseModule],
  providers: [FoodEntryRepository, DatabaseModule, FoodEntryAnalyzer],
  controllers: [FoodEntryController],
})
export class FoodEntryModule {}
