import {
  pgTable,
  serial,
  text,
  integer,
  json,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createSchemaFactory, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

const { createInsertSchema } = createSchemaFactory({
  coerce: {
    date: true,
  },
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address"),
  price: integer("price"),
  currency: text("currency").default("CZK"),
  usableArea: integer("usable_area"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  imageUrls: json("image_urls").$type<string[]>(),
  metaData: json("meta_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const selectPropertySchema = createSelectSchema(properties);
export const createPropertySchema = createInsertSchema(properties);

export type Property = z.infer<typeof selectPropertySchema>;
export type CreateProperty = z.infer<typeof createPropertySchema>;

export const propertySchema = {
  properties,
};
