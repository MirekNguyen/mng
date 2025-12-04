import Combine
import Foundation
import UIKit

final class FoodEntryRepository: ObservableObject {
    @Published var foodEntries: [FoodEntry]?
    @Published var errorMessage: String?
    @Published var pendingEntry: AnalyzedFoodData?

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

    func addEntry(_ entry: CreateFoodEntry) async throws {
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

    func updateEntry(id: Int, entry: EditFoodEntry) async {
        print(entry)
        do {
            let updatedEntry: FoodEntry = try await networkManager.patch(endpoint: "/food-entry/\(id)", body: entry)
            await MainActor.run {
                if let index = self.foodEntries?.firstIndex(where: { $0.id == id }) {
                    self.foodEntries?[index] = updatedEntry
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
        }
    }

    func analyzeImages(images: [UIImage]) async {
        guard !images.isEmpty else {
            await MainActor.run {
                self.errorMessage = "No images were selected for analysis."
            }
            return
        }

        // 1. Convert [UIImage] to [ImageUploadData]
        //
        //    HERE IS THE FIX:
        //    The type must be [ImageUploadData], not [UIImage]
        //
        let imagesToUpload: [ImageUploadData] = images.compactMap { image in
            // Compress image to JPEG
            guard let imageData = image.jpegData(compressionQuality: 0.8) else {
                return nil
            }

            // Create the upload data structure
            return ImageUploadData(
                data: imageData,
                fileName: "\(UUID().uuidString).jpg",  // Create a unique filename
                mimeType: "image/jpeg"
            )
        }

        // Check if any images failed to convert
        if imagesToUpload.isEmpty && !images.isEmpty {
            // This check is now more robust:
            // If we had images but none converted, it's an error.
            await MainActor.run {
                self.errorMessage = "An error occurred while preparing images."
            }
            return
        }

        // 2. Make the network call
        do {
            // Clear the error message before starting the request
            await MainActor.run {
                self.errorMessage = nil
            }

            let newEntry: AnalyzedFoodData? = try await networkManager.postImages(
                endpoint: "/food-entry/analyze",
                images: imagesToUpload
            )

            print("✅ Analysis successful. Server response:", newEntry ?? "Server returned null")

            // 2. Instead of appending, publish the pending entry
            if let newEntry = newEntry {
                await MainActor.run {
                    self.pendingEntry = newEntry
                }
            } else {
                await MainActor.run {
                    self.errorMessage = "Analysis complete, but no food data could be extracted."
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
        }
    }
}
