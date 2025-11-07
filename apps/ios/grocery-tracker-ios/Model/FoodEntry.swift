import Foundation

struct FoodEntry: Identifiable, Codable, Equatable {
    let id: Int?
    let userId: Int?
    let mealId: Int?
    let foodName: String
    let mealType: String
    let amount: Double?
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let caffeine: Double?
    let unit: String
    let entryDate: String  // ISO string "YYYY-MM-DD"
    let entryTime: String  // "HH:mm:ss"
    let createdAt: Date?
}
