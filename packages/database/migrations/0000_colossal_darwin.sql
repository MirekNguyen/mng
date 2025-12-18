-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
CREATE TABLE "meal_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"meal_id" integer,
	"meal_type" varchar(50) NOT NULL,
	"plan_date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"latitude" double precision,
	"longitude" double precision,
	CONSTRAINT "properties_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"daily_reminders" boolean DEFAULT true,
	"goal_updates" boolean DEFAULT true,
	"weekly_summary" boolean DEFAULT true,
	"app_updates" boolean DEFAULT false,
	"newsletter" boolean DEFAULT false,
	"breakfast_reminder_time" varchar(5) DEFAULT '08:00',
	"lunch_reminder_time" varchar(5) DEFAULT '12:30',
	"dinner_reminder_time" varchar(5) DEFAULT '18:30',
	"data_storage" boolean DEFAULT true,
	"cloud_backup" boolean DEFAULT true,
	"analytics" boolean DEFAULT true,
	"personalization" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"weight" numeric(5, 1) NOT NULL,
	"entry_date" date NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"unit" varchar(50) DEFAULT 'serving',
	"description" text,
	"calories" numeric(10, 2) NOT NULL,
	"protein" numeric(10, 2) NOT NULL,
	"carbs" numeric(10, 2) NOT NULL,
	"fat" numeric(10, 2) NOT NULL,
	"tags" text[],
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"caffeine" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"calorie_goal" integer NOT NULL,
	"protein_goal" integer,
	"carbs_goal" integer,
	"fat_goal" integer,
	"water_goal" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "nutrition_goals_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "body_measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"chest" numeric(5, 1),
	"waist" numeric(5, 1),
	"hips" numeric(5, 1),
	"arms" numeric(5, 1),
	"thighs" numeric(5, 1),
	"entry_date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "food_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"meal_id" integer,
	"food_name" varchar(255) NOT NULL,
	"meal_type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) DEFAULT '1',
	"calories" numeric(10, 2) NOT NULL,
	"protein" numeric(10, 2) NOT NULL,
	"carbs" numeric(10, 2) NOT NULL,
	"fat" numeric(10, 2) NOT NULL,
	"entry_date" varchar(10) NOT NULL,
	"entry_time" varchar(8) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"caffeine" numeric(10, 2),
	"unit" varchar(50) DEFAULT 'pcs'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"age" integer,
	"gender" varchar(20),
	"height" integer,
	"target_weight" numeric(10, 2),
	"activity_level" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"weight" numeric(10, 2),
	"goal" varchar(20),
	"daily_calorie_target" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"avatar_url" varchar(500),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
