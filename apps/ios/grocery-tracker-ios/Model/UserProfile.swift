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
    
    /// Mifflin-St Jeor BMR calculation
    var bmr: Double? {
        guard let weight = weight, let height = height, let age = age, let gender = gender else {
            return nil
        }
        let base = 10 * weight + 6.25 * Double(height) - 5 * Double(age)
        if gender.lowercased() == "female" {
            return base - 161
        } else {
            return base + 5
        }
    }
    
    /// TDEE = BMR * activity multiplier
    var tdee: Double? {
        guard let bmr = bmr, let activityLevel = activityLevel else { return nil }
        let multiplier: Double
        switch activityLevel.lowercased() {
        case "sedentary":       multiplier = 1.2
        case "light":           multiplier = 1.375
        case "moderate":        multiplier = 1.55
        case "active":          multiplier = 1.725
        case "very_active":     multiplier = 1.9
        default:                multiplier = 1.55
        }
        return bmr * multiplier
    }
}
