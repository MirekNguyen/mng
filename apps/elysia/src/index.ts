import { db, eq } from "@mng/database/db";
import { foodEntries } from "@mng/database/schema/other.schema";
import { Property } from "@mng/database/schema/properties.schema";
import Elysia from "elysia";
import z from "zod";

const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);

app.get("properties", async (): Promise<Property[]> => {
  const properties: Property[] = await db.query.properties.findMany();
});

app.get("food", async () => {
  return await db.query.food.findMany();
});

app.get(
  "food-entry",
  async ({ query }) => {
    const dateString = query.date.toISOString().split("T")[0];
    return await db.query.foodEntries.findMany({
      where: eq(foodEntries.entryDate, dateString),
    });
  },
  {
    query: z.object({ date: z.coerce.date() }),
  },
);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
