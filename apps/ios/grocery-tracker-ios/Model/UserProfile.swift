import Foundation

struct UserProfile: Codable, Identifiable {
    let id: Int
    let firstName: String?
    let lastName: String?
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
    let updatedAt: Date
    
    var name: String {
        let fullName = "\(firstName ?? "") \(lastName ?? "")".trimmingCharacters(in: .whitespaces)
        return fullName.isEmpty ? "Guest User" : fullName
    }
    
    var isProfileComplete: Bool {
        age != nil && gender != nil && height != nil && weight != nil && targetWeight != nil && activityLevel != nil && goal != nil && dailyCalorieTarget != nil
    }
}
