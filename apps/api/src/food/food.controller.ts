import { db } from "@mng/database/db";
import { Food } from "@mng/database/schema/other.schema";
import Elysia from "elysia";

const app = new Elysia({ prefix: "food" });

app.get("/", async (): Promise<Food[]> => {
  return await db.query.food.findMany();
});

export { app as foodController };
