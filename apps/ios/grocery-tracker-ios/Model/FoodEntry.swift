import Foundation

struct FoodEntry: Identifiable, Codable, Hashable, BaseFoodEntry {
    let id: Int
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

struct CreateFoodEntry: Codable, Equatable, BaseFoodEntry {
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
    let entryDate: String
    let entryTime: String
    let createdAt: Date?
}

protocol BaseFoodEntry {
    var userId: Int? { get }
    var mealId: Int? { get }
    var foodName: String { get }
    var mealType: String { get }
    var amount: Double? { get }
    var calories: Double { get }
    var protein: Double { get }
    var carbs: Double { get }
    var fat: Double { get }
    var caffeine: Double? { get }
    var unit: String { get }
    var entryDate: String { get }
    var entryTime: String { get }
    var createdAt: Date? { get }
}

struct EditFoodEntry: Codable {
    var foodName: String
    var entryDate: Date
    var entryTime: Date

    init(foodEntry: FoodEntry) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm:ss"

        self.foodName = foodEntry.foodName
        self.entryDate = dateFormatter.date(from: foodEntry.entryDate) ?? Date()
        self.entryTime = timeFormatter.date(from: foodEntry.entryTime) ?? Date()
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(foodName, forKey: .foodName)
        try container.encode(entryDateString, forKey: .entryDate)
        try container.encode(entryTimeString, forKey: .entryTime)
    }

    var entryDateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: entryDate)
    }
    var entryTimeString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: entryTime)
    }
}

/// A custom struct to decode the analysis response from the server.
/// Make it Hashable so we can use it with .sheet(item: ...).
struct AnalyzedFoodData: Identifiable, Codable, Hashable {
    let id = UUID()
    var name: String
    var calories: Double
    var protein: Double
    var carbs: Double
    var fats: Double
    var amount: Double
    var unit: String
}

extension FoodEntry {
    var formattedAmount: String {
        let val = amount ?? 0
        let isInteger = val.truncatingRemainder(dividingBy: 1) == 0
        let numberString =
            isInteger
            ? String(format: "%.0f", val)
            : String(format: "%.1f", val)
        return "\(numberString) \(unit)"
    }
}
