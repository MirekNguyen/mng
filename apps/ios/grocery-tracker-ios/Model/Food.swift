import Foundation

struct Food: Identifiable, Codable, Equatable, Hashable {
    let id: Int
    let userId: Int?
    let name: String
    let unit: String?
    let description: String?
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let caffeine: Double?
    let tags: [String]?
    let isFavorite: Bool?
    let createdAt: Date?
}
