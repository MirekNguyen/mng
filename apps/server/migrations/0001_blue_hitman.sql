ALTER TABLE "food_entries" ALTER COLUMN "calories" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "protein" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "carbs" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "calories" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "protein" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "carbs" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "fat" SET DATA TYPE numeric(10, 2);