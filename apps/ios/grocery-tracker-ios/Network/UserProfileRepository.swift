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
}
