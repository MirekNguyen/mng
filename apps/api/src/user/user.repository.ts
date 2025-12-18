import { db, eq } from "@mng/database/db";
import { users, type User, type CreateUser, type UpdateUser } from "@mng/database/schema/other.schema";

export const UserRepository = {
  async getById(userId: number): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  },

  async getByEmail(email: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    return user;
  },

  async create(data: CreateUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  },

  async update(userId: number, data: UpdateUser): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    if (!updated) {
      throw new Error(`User with id ${userId} not found for update`);
    }
    return updated;
  },
};
