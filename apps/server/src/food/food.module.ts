import { Module } from "@nestjs/common";
import { FoodController } from "./food.controller";
import { FoodRepository } from "./food.repository";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [FoodRepository],
  controllers: [FoodController],
})
export class FoodModule {}
