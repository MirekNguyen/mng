import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createSchemaFactory, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

const { createInsertSchema } = createSchemaFactory({
  coerce: {
    date: true,
  },
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  height: integer("height"), // cm
  weight: numeric("weight", { precision: 10, scale: 2, mode: "number" }), // kg
  targetWeight: numeric("target_weight", { precision: 10, scale: 2, mode: "number" }), // kg
  activityLevel: varchar("activity_level", { length: 50 }),
  goal: varchar("goal", { length: 20 }),
  dailyCalorieTarget: integer("daily_calorie_target"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meals table (reusable meal templates)
export const food = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("serving"),
  description: text("description"),
  calories: numeric("calories", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).notNull(),
  protein: numeric("protein", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).notNull(),
  carbs: numeric("carbs", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).notNull(),
  fat: numeric("fat", { precision: 10, scale: 2, mode: "number" }).notNull(),
  caffeine: numeric("caffeine", { precision: 10, scale: 2, mode: "number" }),
  tags: text("tags").array(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Food entries table (daily food log)
export const foodEntries = pgTable("food_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  mealId: integer("meal_id").references(() => food.id, {
    onDelete: "set null",
  }),
  foodName: varchar("food_name", { length: 255 }).notNull(),
  mealType: varchar("meal_type", { length: 50 }).notNull(),
  amount: numeric("amount", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).default(1),
  calories: numeric("calories", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).notNull(),
  protein: numeric("protein", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).notNull(),
  carbs: numeric("carbs", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).notNull(),
  fat: numeric("fat", { precision: 10, scale: 2, mode: "number" }).notNull(),
  caffeine: numeric("caffeine", { precision: 10, scale: 2, mode: "number" }),
  unit: varchar("unit", { length: 50 }).default("pcs"), // "g" | "ml" | "oz" | "cup" | "tbsp" | "tsp" | "piece"
  entryDate: varchar("entry_date", { length: 10 }).notNull(), // Store as YYYY-MM-DD string
  entryTime: varchar("entry_time", { length: 8 }).notNull(), // Store as HH:MM:SS string
  createdAt: timestamp("created_at").defaultNow(),
});

// Nutrition goals table
export const nutritionGoals = pgTable("nutrition_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  calorieGoal: integer("calorie_goal").notNull(),
  proteinGoal: integer("protein_goal"),
  carbsGoal: integer("carbs_goal"),
  fatGoal: integer("fat_goal"),
  waterGoal: integer("water_goal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weight entries table
export const weightEntries = pgTable("weight_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  weight: numeric("weight", { precision: 5, scale: 1 }).notNull(),
  entryDate: date("entry_date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Body measurements table
export const bodyMeasurements = pgTable("body_measurements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  chest: numeric("chest", { precision: 5, scale: 1 }),
  waist: numeric("waist", { precision: 5, scale: 1 }),
  hips: numeric("hips", { precision: 5, scale: 1 }),
  arms: numeric("arms", { precision: 5, scale: 1 }),
  thighs: numeric("thighs", { precision: 5, scale: 1 }),
  entryDate: date("entry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meal plans table
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  mealId: integer("meal_id").references(() => food.id, {
    onDelete: "cascade",
  }),
  mealType: varchar("meal_type", { length: 50 }).notNull(),
  planDate: date("plan_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  dailyReminders: boolean("daily_reminders").default(true),
  goalUpdates: boolean("goal_updates").default(true),
  weeklySummary: boolean("weekly_summary").default(true),
  appUpdates: boolean("app_updates").default(false),
  newsletter: boolean("newsletter").default(false),
  breakfastReminderTime: varchar("breakfast_reminder_time", {
    length: 5,
  }).default("08:00"),
  lunchReminderTime: varchar("lunch_reminder_time", { length: 5 }).default("12:30"),
  dinnerReminderTime: varchar("dinner_reminder_time", { length: 5 }).default("18:30"),
  dataStorage: boolean("data_storage").default(true),
  cloudBackup: boolean("cloud_backup").default(true),
  analytics: boolean("analytics").default(true),
  personalization: boolean("personalization").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const createFoodSchema = createInsertSchema(food);
export const selectFoodSchema = createSelectSchema(food);
export const updateFoodSchema = createInsertSchema(food).partial();

export const createFoodEntrySchema = createInsertSchema(foodEntries);
export const selectFoodEntrySchema = createSelectSchema(foodEntries);
export const updateFoodEntrySchema = createInsertSchema(foodEntries).partial();

export const createNutritionGoalSchema = createInsertSchema(nutritionGoals);
export const selectNutritionGoalSchema = createSelectSchema(nutritionGoals);

export const createWeightEntrySchema = createInsertSchema(weightEntries);
export const selectWeightEntrySchema = createSelectSchema(weightEntries);

export const createBodyMeasurementSchema = createInsertSchema(bodyMeasurements);
export const selectBodyMeasurementSchema = createSelectSchema(bodyMeasurements);

export const createMealPlanSchema = createInsertSchema(mealPlans);
export const selectMealPlanSchema = createSelectSchema(mealPlans);

export const createUserSettingsSchema = createInsertSchema(userSettings);
export const selectUserSettingsSchema = createSelectSchema(userSettings);

// User schemas
export const userZodSchema = createSelectSchema(users);
export const createUserZodSchema = createInsertSchema(users);
export const updateUserZodSchema = createUserZodSchema.partial();

// Legacy exports for backwards compatibility
export const insertUserSchema = createUserZodSchema;
export const selectUserSchema = userZodSchema;
export const updateUserSchema = updateUserZodSchema;

// Custom types
export type User = z.infer<typeof userZodSchema>;
export type CreateUser = z.infer<typeof createUserZodSchema>;
export type UpdateUser = z.infer<typeof updateUserZodSchema>;

export type Food = z.infer<typeof selectFoodSchema>;
export type CreateFood = Omit<z.infer<typeof createFoodSchema>, "id">;
export type UpdateFood = Partial<CreateFood>;

export type FoodEntry = z.infer<typeof selectFoodEntrySchema>;
export type CreateFoodEntry = Omit<z.infer<typeof createFoodEntrySchema>, "id">;
export type UpdateFoodEntry = Partial<CreateFoodEntry>;

export type NutritionGoal = z.infer<typeof selectNutritionGoalSchema>;
export type NewNutritionGoal = z.infer<typeof createNutritionGoalSchema>;

export type WeightEntry = z.infer<typeof selectWeightEntrySchema>;
export type NewWeightEntry = z.infer<typeof createWeightEntrySchema>;

export type BodyMeasurement = z.infer<typeof selectBodyMeasurementSchema>;
export type NewBodyMeasurement = z.infer<typeof createBodyMeasurementSchema>;

export type MealPlan = z.infer<typeof selectMealPlanSchema>;
export type NewMealPlan = z.infer<typeof createMealPlanSchema>;

export type UserSettings = z.infer<typeof selectUserSettingsSchema>;
export type NewUserSettings = z.infer<typeof createUserSettingsSchema>;

export const weightEntriesRelations = relations(weightEntries, ({ one }) => ({
  user: one(users, {
    fields: [weightEntries.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  weightEntries: many(weightEntries),
}));

export const otherSchema = {
  users,
  food,
  foodEntries,
  nutritionGoals,
  weightEntries,
  bodyMeasurements,
  userSettings,
  weightEntriesRelations,
  usersRelations,
};
