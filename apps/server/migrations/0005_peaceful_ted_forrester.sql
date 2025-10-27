ALTER TABLE "food_entries" ALTER COLUMN "amount" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "protein" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "carbs" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "fat" SET NOT NULL;