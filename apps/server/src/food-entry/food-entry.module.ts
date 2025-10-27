import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { FoodEntryController } from './food-entry.controller';
import { FoodEntryRepository } from './food-entry.repository';

@Module({
  imports: [DatabaseModule],
  providers: [FoodEntryRepository, DatabaseModule],
  controllers: [FoodEntryController],
})
export class FoodEntryModule {}
