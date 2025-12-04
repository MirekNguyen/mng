import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/database/database.module";
import { FoodController } from "./food.controller";
import { FoodRepository } from "./food.repository";

@Module({
  imports: [DatabaseModule],
  providers: [FoodRepository],
  controllers: [FoodController],
})
export class FoodModule {}
