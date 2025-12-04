import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { ICrudRepository } from "src/common/icrud.controller";
import {
  DRIZZLE_PROVIDER,
  type DrizzleDatabase,
} from "src/database/drizzle.provider";
import {
  CreateFood,
  Food,
  food,
  UpdateFood,
} from "src/database/schema/other.schema";

@Injectable()
export class FoodRepository implements ICrudRepository<Food> {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase) {}

  async getAll(): Promise<Food[]> {
    return await this.db.query.food.findMany();
  }
  async update(id: number, updateEntity: UpdateFood) {
    const updated = (
      await this.db
        .update(food)
        .set(updateEntity)
        .where(eq(food.id, id))
        .returning()
    )[0];
    if (!updated) {
      throw new NotFoundException(`Food not found for update`);
    }
    return updated;
  }
  async create(createEntity: CreateFood): Promise<Food> {
    const created = (
      await this.db.insert(food).values(createEntity).returning()
    )[0];
    if (!created) {
      throw new InternalServerErrorException("Failed to create food");
    }
    return created;
  }

  async delete(id: number): Promise<Food> {
    const deleted = (
      await this.db.delete(food).where(eq(food.id, id)).returning()
    )[0];
    if (!deleted) {
      throw new NotFoundException(`Food not found for delete`);
    }
    return deleted;
  }
}
