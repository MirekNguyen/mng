CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"address" text,
	"price" integer,
	"currency" text DEFAULT 'CZK',
	"usable_area" integer,
	"image_urls" json,
	"meta_data" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "properties_external_id_unique" UNIQUE("external_id")
);
