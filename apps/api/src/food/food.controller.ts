import { db } from "@mng/database/db";
import Elysia from "elysia";
import { Food } from "@mng/database/schema/other.schema";

const app = new Elysia({ prefix: "food" });

app.get("/", async (): Promise<Food[]> => {
  return await db.query.food.findMany();
});

export { app as foodController };
