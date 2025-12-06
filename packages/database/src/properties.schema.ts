import {
  doublePrecision,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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
