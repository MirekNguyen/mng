ALTER TABLE "properties" ADD COLUMN "price_note" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "floor" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "building_type" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "building_condition" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "ownership" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "energy_efficiency" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "energy_efficiency_rating" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "location_type" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "telecom" json;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_elevator" boolean;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_barrier_free" boolean;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "available_from" text;