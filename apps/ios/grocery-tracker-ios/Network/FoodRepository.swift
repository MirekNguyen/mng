import Combine
import Foundation

class FoodRepository: ObservableObject {
    @Published var foods: [Food]?
    @Published var errorMessage: String?

    private let networkManager: NetworkManager2

    init(networkManager: NetworkManager2) {
        self.networkManager = networkManager
    }

    func fetchFoods() async {
        do {
            let fetched: [Food] = try await networkManager.get(endpoint: "/food")
            await MainActor.run { self.foods = fetched }
        } catch {
            await MainActor.run { self.errorMessage = error.localizedDescription }
        }
    }
}
