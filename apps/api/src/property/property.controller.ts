import { db } from "@mng/database/db";
import { Property } from "@mng/database/schema/properties.schema";
import { scrapeEstatesFromUrls } from "@mng/scraper/sreality.scraper";
import Elysia from "elysia";
import z from "zod";

import { PropertyRepository } from "./property.repository";

const app = new Elysia({ prefix: "property" });

app.get("/", async (): Promise<Property[]> => {
  return await db.query.properties.findMany();
});

app.post(
  "/scrape",
  async ({ body }): Promise<Property[]> => {
    const scraped = await scrapeEstatesFromUrls(body.urls);
    return PropertyRepository.upsertMany(scraped);
  },
  {
    body: z.object({
      urls: z.array(z.string().url()).min(1),
    }),
  },
);

export { app as propertyController };
