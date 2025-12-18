import { pgTable, foreignKey, serial, integer, varchar, date, timestamp, unique, text, json, doublePrecision, boolean, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const mealPlans = pgTable("meal_plans", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	mealId: integer("meal_id"),
	mealType: varchar("meal_type", { length: 50 }).notNull(),
	planDate: date("plan_date").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.mealId],
			foreignColumns: [meals.id],
			name: "meal_plans_meal_id_meals_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "meal_plans_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const properties = pgTable("properties", {
	id: serial().primaryKey().notNull(),
	externalId: text("external_id").notNull(),
	title: text().notNull(),
	description: text(),
	address: text(),
	price: integer(),
	currency: text().default('CZK'),
	usableArea: integer("usable_area"),
	imageUrls: json("image_urls"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	latitude: doublePrecision(),
	longitude: doublePrecision(),
}, (table) => [
	unique("properties_external_id_unique").on(table.externalId),
]);

export const userSettings = pgTable("user_settings", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	dailyReminders: boolean("daily_reminders").default(true),
	goalUpdates: boolean("goal_updates").default(true),
	weeklySummary: boolean("weekly_summary").default(true),
	appUpdates: boolean("app_updates").default(false),
	newsletter: boolean().default(false),
	breakfastReminderTime: varchar("breakfast_reminder_time", { length: 5 }).default('08:00'),
	lunchReminderTime: varchar("lunch_reminder_time", { length: 5 }).default('12:30'),
	dinnerReminderTime: varchar("dinner_reminder_time", { length: 5 }).default('18:30'),
	dataStorage: boolean("data_storage").default(true),
	cloudBackup: boolean("cloud_backup").default(true),
	analytics: boolean().default(true),
	personalization: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_settings_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_settings_user_id_unique").on(table.userId),
]);

export const weightEntries = pgTable("weight_entries", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	weight: numeric({ precision: 5, scale:  1 }).notNull(),
	entryDate: date("entry_date").notNull(),
	note: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "weight_entries_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const meals = pgTable("meals", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	name: varchar({ length: 255 }).notNull(),
	unit: varchar({ length: 50 }).default('serving'),
	description: text(),
	calories: numeric({ precision: 10, scale:  2 }).notNull(),
	protein: numeric({ precision: 10, scale:  2 }).notNull(),
	carbs: numeric({ precision: 10, scale:  2 }).notNull(),
	fat: numeric({ precision: 10, scale:  2 }).notNull(),
	tags: text().array(),
	isFavorite: boolean("is_favorite").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	caffeine: numeric({ precision: 10, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "meals_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const nutritionGoals = pgTable("nutrition_goals", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	calorieGoal: integer("calorie_goal").notNull(),
	proteinGoal: integer("protein_goal"),
	carbsGoal: integer("carbs_goal"),
	fatGoal: integer("fat_goal"),
	waterGoal: integer("water_goal"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "nutrition_goals_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("nutrition_goals_user_id_unique").on(table.userId),
]);

export const bodyMeasurements = pgTable("body_measurements", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	chest: numeric({ precision: 5, scale:  1 }),
	waist: numeric({ precision: 5, scale:  1 }),
	hips: numeric({ precision: 5, scale:  1 }),
	arms: numeric({ precision: 5, scale:  1 }),
	thighs: numeric({ precision: 5, scale:  1 }),
	entryDate: date("entry_date").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "body_measurements_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const foodEntries = pgTable("food_entries", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	mealId: integer("meal_id"),
	foodName: varchar("food_name", { length: 255 }).notNull(),
	mealType: varchar("meal_type", { length: 50 }).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).default('1'),
	calories: numeric({ precision: 10, scale:  2 }).notNull(),
	protein: numeric({ precision: 10, scale:  2 }).notNull(),
	carbs: numeric({ precision: 10, scale:  2 }).notNull(),
	fat: numeric({ precision: 10, scale:  2 }).notNull(),
	entryDate: varchar("entry_date", { length: 10 }).notNull(),
	entryTime: varchar("entry_time", { length: 8 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	caffeine: numeric({ precision: 10, scale:  2 }),
	unit: varchar({ length: 50 }).default('pcs'),
}, (table) => [
	foreignKey({
			columns: [table.mealId],
			foreignColumns: [meals.id],
			name: "food_entries_meal_id_meals_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "food_entries_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	age: integer(),
	gender: varchar({ length: 20 }),
	height: integer(),
	targetWeight: numeric("target_weight", { precision: 10, scale:  2 }),
	activityLevel: varchar("activity_level", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	weight: numeric({ precision: 10, scale:  2 }),
	goal: varchar({ length: 20 }),
	dailyCalorieTarget: integer("daily_calorie_target"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	avatarUrl: varchar("avatar_url", { length: 500 }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);
