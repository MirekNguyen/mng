import Combine
import Foundation
import UIKit

final class FoodEntryRepository: ObservableObject {
    @Published var foodEntries: [FoodEntry]?
    @Published var errorMessage: String?

    private let networkManager: NetworkManager2

    init(networkManager: NetworkManager2) {
        self.networkManager = networkManager
    }

    func getEntries(date: Date) async {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: date)
        do {
            let fetched: [FoodEntry] = try await networkManager.get(
                endpoint: "/food-entry?date=\(dateString)")
            await MainActor.run { self.foodEntries = fetched }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
        }
    }

    func deleteEntry(id: Int) async {
        do {
            try await networkManager.delete(endpoint: "/food-entry/\(id)")
            await MainActor.run {
                self.foodEntries?.removeAll { $0.id == id }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
        }
    }

    func addEntry(_ entry: FoodEntry) async throws {
        do {
            let created: FoodEntry = try await networkManager.post(
                endpoint: "/food-entry",
                body: entry
            )
            await MainActor.run {
                if self.foodEntries != nil {
                    self.foodEntries?.append(created)
                } else {
                    self.foodEntries = [created]
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
        }
    }
}
