import Combine
import Foundation

struct CreateFoodRequest: Codable {
    let name: String
    let unit: String?
    let description: String?
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let caffeine: Double?
}

struct UpdateFoodRequest: Codable {
    let name: String
    let unit: String?
    let description: String?
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let caffeine: Double?
}

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
    
    func createFood(request: CreateFoodRequest) async throws -> Food {
        let created: Food = try await networkManager.post(endpoint: "/food", body: request)
        await MainActor.run {
            if self.foods != nil {
                self.foods?.append(created)
            }
        }
        return created
    }
    
    func updateFood(id: Int, request: UpdateFoodRequest) async throws -> Food {
        let updated: Food = try await networkManager.put(endpoint: "/food/\(id)", body: request)
        await MainActor.run {
            if let index = self.foods?.firstIndex(where: { $0.id == id }) {
                self.foods?[index] = updated
            }
        }
        return updated
    }
    
    func deleteFood(id: Int) async throws {
        try await networkManager.delete(endpoint: "/food/\(id)")
        await MainActor.run {
            self.foods?.removeAll(where: { $0.id == id })
        }
    }
}
