import Foundation

struct UserProfile: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let avatarUrl: String?
    let age: Int?
    let gender: String?
    let height: Int?
    let weight: Double?
    let targetWeight: Double?
    let activityLevel: String?
    let goal: String?
    let dailyCalorieTarget: Int?
    let createdAt: Date
    let streak: Int
    let totalEntries: Int
    
    var isProfileComplete: Bool {
        age != nil && gender != nil && height != nil && weight != nil && targetWeight != nil && activityLevel != nil && goal != nil && dailyCalorieTarget != nil
    }
}
