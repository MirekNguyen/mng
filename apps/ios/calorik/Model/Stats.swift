import Foundation

struct Stats: Codable {
    let averageCalories: Double
    let averageProtein: Double
    let averageCarbs: Double
    let averageFat: Double
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
    let averageCalories: Double
    let percentage: Double
    let entryCount: Int
}
