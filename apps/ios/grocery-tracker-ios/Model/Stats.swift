import Foundation

struct Stats: Codable {
    let totalCalories: Double
    let totalProtein: Double
    let totalCarbs: Double
    let totalFat: Double
    let averageCaloriesPerDay: Double
    let entryCount: Int
    let dailyBreakdown: [DailyStats]
    let mealTypeBreakdown: [MealTypeStats]
}

struct DailyStats: Codable, Identifiable {
    var id: String { date }
    let date: String
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let entryCount: Int
}

struct MealTypeStats: Codable, Identifiable {
    var id: String { mealType }
    let mealType: String
    let calories: Double
    let entryCount: Int
}
