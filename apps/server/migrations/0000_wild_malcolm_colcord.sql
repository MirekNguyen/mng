CREATE TYPE "public"."receipt_category" AS ENUM('bakery', 'dairy', 'beverage', 'meat', 'produce', 'snack', 'household', 'other');--> statement-breakpoint
CREATE TABLE "receipt_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_id" integer,
	"date" timestamp DEFAULT now() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" "receipt_category" NOT NULL,
	"unit" varchar(10),
	"price" double precision NOT NULL,
	"quantity" double precision NOT NULL,
	"priceTotal" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt" (
	"id" serial PRIMARY KEY NOT NULL,
	"total" double precision NOT NULL,
	"date" timestamp NOT NULL,
	"currency" varchar(10) NOT NULL,
	"store_name" varchar
);
--> statement-breakpoint
ALTER TABLE "receipt_item" ADD CONSTRAINT "receipt_item_receipt_id_receipt_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipt"("id") ON DELETE no action ON UPDATE no action;