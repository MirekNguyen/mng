import { db } from "@mng/database/db";
import { Property } from "@mng/database/schema/properties.schema";
import Elysia from "elysia";

const app = new Elysia({ prefix: "property" });

app.get("/", async (): Promise<Property[]> => {
  const properties: Property[] = await db.query.properties.findMany();
  return properties;
});

export { app as propertyController };
