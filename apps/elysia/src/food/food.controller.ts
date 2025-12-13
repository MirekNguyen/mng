import { db } from "@mng/database/db";
import Elysia from "elysia";

const app = new Elysia({ prefix: "food" });

app.get("/", async () => {
  return await db.query.food.findMany();
});

export { app as foodController };
