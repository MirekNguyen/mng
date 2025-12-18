import Foundation
import Combine

final class UserProfileRepository: ObservableObject {
    @Published var profile: UserProfile?
    @Published var errorMessage: String?
    @Published var isLoading: Bool = false
    
    private let networkManager: NetworkManager2
    
    init(networkManager: NetworkManager2) {
        self.networkManager = networkManager
    }
    
    func fetchProfile() async {
        await MainActor.run { isLoading = true }
        
        do {
            let fetchedProfile: UserProfile = try await networkManager.get(endpoint: "/user/profile")
            await MainActor.run {
                self.profile = fetchedProfile
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func updateProfile(
        firstName: String?,
        lastName: String?,
        age: Int?,
        gender: String?,
        height: Int?,
        weight: Double?,
        targetWeight: Double?,
        activityLevel: String?,
        goal: String?,
        dailyCalorieTarget: Int?
    ) async {
        await MainActor.run { isLoading = true }
        
        struct UpdateProfileRequest: Encodable {
            let firstName: String?
            let lastName: String?
            let age: Int?
            let gender: String?
            let height: Int?
            let weight: Double?
            let targetWeight: Double?
            let activityLevel: String?
            let goal: String?
            let dailyCalorieTarget: Int?
        }
        
        let requestBody = UpdateProfileRequest(
            firstName: firstName,
            lastName: lastName,
            age: age,
            gender: gender,
            height: height,
            weight: weight,
            targetWeight: targetWeight,
            activityLevel: activityLevel,
            goal: goal,
            dailyCalorieTarget: dailyCalorieTarget
        )
        
        do {
            let updatedProfile: UserProfile = try await networkManager.patch(
                endpoint: "/user/profile",
                body: requestBody
            )
            await MainActor.run {
                self.profile = updatedProfile
                self.isLoading = false
                self.errorMessage = nil
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
}
