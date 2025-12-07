import { db } from "@mng/database/db";
import Elysia from "elysia";

const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);

app.get("properties", async () => {
  return await db.query.properties.findMany();
});

app.get("food", async () => {
  return await db.query.food.findMany();
});

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
