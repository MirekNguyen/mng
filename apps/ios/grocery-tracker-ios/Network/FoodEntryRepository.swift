import Combine
import Foundation
import UIKit

final class FoodEntryRepository: ObservableObject {
    @Published var foodEntries: [FoodEntry]?
    @Published var errorMessage: String?
    @Published var pendingEntry: AnalyzedFoodData?
    @Published var analysisStage: AnalysisStage = .idle

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

    func analyzeImages(images: [UIImage], prompt: String? = nil) async {
        let hasImages = !images.isEmpty
        let hasPrompt = prompt != nil && !(prompt!.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        guard hasImages || hasPrompt else {
            await MainActor.run {
                self.errorMessage = "Please add a photo or describe your meal before analysing."
            }
            return
        }

        // Update stage: preparing
        await MainActor.run {
            self.analysisStage = .preparing
            self.errorMessage = nil
        }
        
        // Simulate a brief delay for preparing (compress images)
        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        // 1. Convert [UIImage] to [ImageUploadData]
        let imagesToUpload: [ImageUploadData] = images.compactMap { image in
            // Compress image to JPEG
            guard let imageData = image.jpegData(compressionQuality: 0.8) else {
                return nil
            }

            return ImageUploadData(
                data: imageData,
                fileName: "\(UUID().uuidString).jpg",
                mimeType: "image/jpeg"
            )
        }

        if imagesToUpload.isEmpty && !images.isEmpty {
            await MainActor.run {
                self.errorMessage = "An error occurred while preparing images."
                self.analysisStage = .failed(error: "Failed to prepare images")
            }
            return
        }

        // 2. Make the network call
        do {
            let isTextOnly = imagesToUpload.isEmpty

            // Update stage: uploading with progress simulation (skip for text-only)
            if !isTextOnly {
                await MainActor.run {
                    self.analysisStage = .uploading(progress: 0.0)
                }
                for progress in stride(from: 0.0, through: 1.0, by: 0.2) {
                    await MainActor.run {
                        self.analysisStage = .uploading(progress: progress)
                    }
                    try? await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds
                }
            }
            
            // Update stage: analyzing with detailed messages
            let analysisMessages: [String] = isTextOnly ? [
                "Reading your description...",
                "Looking up nutritional data...",
                "Estimating calories and macros...",
                "Finalizing analysis..."
            ] : [
                "Processing image data...",
                "Identifying food items...",
                "Analyzing portions and ingredients...",
                "Calculating nutritional values...",
                "Estimating calories and macros...",
                "Finalizing analysis..."
            ]
            
            // Start analysis phase with initial progress
            await MainActor.run {
                self.analysisStage = .analyzing(message: analysisMessages[0], progress: 0.0)
            }
            
            // Create a background task to cycle through messages with progress
            let messageTask = Task {
                let totalMessages = analysisMessages.count
                for (index, message) in analysisMessages.enumerated() {
                    guard index > 0 else { continue }
                    let messageProgress = Double(index) / Double(totalMessages - 1)
                    let adjustedProgress = min(messageProgress * 0.95, 0.95)
                    try? await Task.sleep(nanoseconds: UInt64.random(in: 4_000_000_000...5_000_000_000))
                    await MainActor.run {
                        if case .analyzing = self.analysisStage {
                            self.analysisStage = .analyzing(message: message, progress: adjustedProgress)
                        }
                    }
                }
            }

            // Always use multipart /food-entry/analyze; prompt is an optional text field,
            // images array may be empty for text-only analysis.
            let newEntry: AnalyzedFoodData? = try await networkManager.postImages(
                endpoint: "/food-entry/analyze",
                parameters: prompt.map { ["prompt": $0] },
                images: imagesToUpload
            )
            
            // Cancel the message task once we have results
            messageTask.cancel()

            print("✅ Analysis successful. Server response:", newEntry ?? "Server returned null")

            // Update stage: completed
            await MainActor.run {
                self.analysisStage = .completed
            }
            
            // Brief delay to show completion state
            try? await Task.sleep(nanoseconds: 600_000_000) // 0.6 seconds

            if let newEntry = newEntry {
                await MainActor.run {
                    self.pendingEntry = newEntry
                    self.analysisStage = .idle
                }
            } else {
                await MainActor.run {
                    self.errorMessage = "Analysis complete, but no food data could be extracted."
                    self.analysisStage = .failed(error: "No food data found")
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.analysisStage = .failed(error: error.localizedDescription)
            }
        }
    }
}
