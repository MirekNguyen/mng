import { db } from "@mng/database/db";
import Elysia from "elysia";

const app = new Elysia({ prefix: "food" });

app.get("food", async () => {
  return await db.query.food.findMany();
});

export { app as foodController };
