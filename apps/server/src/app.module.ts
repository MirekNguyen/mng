import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ReceiptModule } from './receipt/receipt.module';
import { FoodModule } from './food/food.module';
import { FoodEntryModule } from './food-entry/food-entry.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    ReceiptModule,
    FoodModule,
    FoodEntryModule,
  ],
})
export class AppModule {}
