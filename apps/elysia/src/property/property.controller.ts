import { db } from "@mng/database/db";
import { Property } from "@mng/database/schema/properties.schema";
import Elysia from "elysia";

const app = new Elysia({ prefix: "property" });

app.get("/", async (): Promise<Property[]> => {
  return await db.query.properties.findMany();
});

export { app as propertyController };
