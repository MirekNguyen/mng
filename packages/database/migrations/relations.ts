import { relations } from "drizzle-orm/relations";
import { meals, mealPlans, users, userSettings, weightEntries, nutritionGoals, bodyMeasurements, foodEntries } from "./schema";

export const mealPlansRelations = relations(mealPlans, ({one}) => ({
	meal: one(meals, {
		fields: [mealPlans.mealId],
		references: [meals.id]
	}),
	user: one(users, {
		fields: [mealPlans.userId],
		references: [users.id]
	}),
}));

export const mealsRelations = relations(meals, ({one, many}) => ({
	mealPlans: many(mealPlans),
	user: one(users, {
		fields: [meals.userId],
		references: [users.id]
	}),
	foodEntries: many(foodEntries),
}));

export const usersRelations = relations(users, ({many}) => ({
	mealPlans: many(mealPlans),
	userSettings: many(userSettings),
	weightEntries: many(weightEntries),
	meals: many(meals),
	nutritionGoals: many(nutritionGoals),
	bodyMeasurements: many(bodyMeasurements),
	foodEntries: many(foodEntries),
}));

export const userSettingsRelations = relations(userSettings, ({one}) => ({
	user: one(users, {
		fields: [userSettings.userId],
		references: [users.id]
	}),
}));

export const weightEntriesRelations = relations(weightEntries, ({one}) => ({
	user: one(users, {
		fields: [weightEntries.userId],
		references: [users.id]
	}),
}));

export const nutritionGoalsRelations = relations(nutritionGoals, ({one}) => ({
	user: one(users, {
		fields: [nutritionGoals.userId],
		references: [users.id]
	}),
}));

export const bodyMeasurementsRelations = relations(bodyMeasurements, ({one}) => ({
	user: one(users, {
		fields: [bodyMeasurements.userId],
		references: [users.id]
	}),
}));

export const foodEntriesRelations = relations(foodEntries, ({one}) => ({
	meal: one(meals, {
		fields: [foodEntries.mealId],
		references: [meals.id]
	}),
	user: one(users, {
		fields: [foodEntries.userId],
		references: [users.id]
	}),
}));