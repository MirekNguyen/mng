import Combine
import Foundation
import UIKit

final class FoodEntryRepository: ObservableObject {
    @Published var foodEntries: [FoodEntry]?
    @Published var errorMessage: String?
    @Published var pendingEntry: AnalyzedFoodData?
    @Published var analysisStage: AnalysisStage = .idle

    /// `true` while analysis is running in the background (sheet dismissed).
    @Published var isAnalyzingInBackground: Bool = false
    /// Progress stage reported while running in the background.
    @Published var backgroundAnalysisStage: AnalysisStage = .idle

    private var backgroundTask: Task<Void, Never>?

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

    // MARK: - Analysis

    /// Starts meal analysis. When `background` is `true` the analysis runs as a
    /// detached task so the caller can dismiss its sheet immediately — the user
    /// can keep using the app while the work completes.
    ///
    /// Progress is reflected on:
    ///   • `analysisStage`          – used by `ImageUploadView` while the sheet is still open
    ///   • `backgroundAnalysisStage` / `isAnalyzingInBackground` – used by `FoodEntryView`
    ///     to show the floating indicator after the sheet is gone
    func analyzeImages(images: [UIImage], prompt: String? = nil, background: Bool = false) async {
        let hasImages = !images.isEmpty
        let hasPrompt = prompt != nil && !(prompt!.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        guard hasImages || hasPrompt else {
            await MainActor.run {
                self.errorMessage = "Please add a photo or describe your meal before analysing."
            }
            return
        }

        if background {
            // Fire-and-forget: caller dismisses its sheet immediately.
            await MainActor.run {
                self.isAnalyzingInBackground = true
                self.backgroundAnalysisStage = .preparing
                self.errorMessage = nil
            }
            backgroundTask?.cancel()
            backgroundTask = Task {
                await self._runAnalysis(images: images, prompt: prompt, stageSetter: { [weak self] stage in
                    await MainActor.run {
                        self?.backgroundAnalysisStage = stage
                    }
                }, onComplete: { [weak self] entry in
                    await MainActor.run {
                        self?.isAnalyzingInBackground = false
                        self?.backgroundAnalysisStage = .idle
                        self?.pendingEntry = entry
                    }
                }, onError: { [weak self] message in
                    await MainActor.run {
                        self?.isAnalyzingInBackground = false
                        self?.backgroundAnalysisStage = .idle
                        self?.errorMessage = message
                    }
                })
            }
        } else {
            // Foreground (blocking): show progress overlay inside the sheet.
            await MainActor.run {
                self.analysisStage = .preparing
                self.errorMessage = nil
            }
            await _runAnalysis(images: images, prompt: prompt, stageSetter: { [weak self] stage in
                await MainActor.run {
                    self?.analysisStage = stage
                }
            }, onComplete: { [weak self] entry in
                await MainActor.run {
                    self?.pendingEntry = entry
                    self?.analysisStage = .idle
                }
            }, onError: { [weak self] message in
                await MainActor.run {
                    self?.errorMessage = message
                    self?.analysisStage = .failed(error: message)
                }
            })
        }
    }

    // MARK: - Private analysis core

    private func _runAnalysis(
        images: [UIImage],
        prompt: String?,
        stageSetter: @escaping (AnalysisStage) async -> Void,
        onComplete: @escaping (AnalyzedFoodData?) async -> Void,
        onError: @escaping (String) async -> Void
    ) async {
        // Simulate a brief delay for preparing (compress images)
        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        // 1. Convert [UIImage] to [ImageUploadData]
        let imagesToUpload: [ImageUploadData] = images.compactMap { image in
            guard let imageData = image.jpegData(compressionQuality: 0.8) else { return nil }
            return ImageUploadData(
                data: imageData,
                fileName: "\(UUID().uuidString).jpg",
                mimeType: "image/jpeg"
            )
        }

        if imagesToUpload.isEmpty && !images.isEmpty {
            await onError("An error occurred while preparing images.")
            return
        }

        do {
            let isTextOnly = imagesToUpload.isEmpty

            // Update stage: uploading with progress simulation (skip for text-only)
            if !isTextOnly {
                await stageSetter(.uploading(progress: 0.0))
                for progress in stride(from: 0.0, through: 1.0, by: 0.2) {
                    await stageSetter(.uploading(progress: progress))
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
            await stageSetter(.analyzing(message: analysisMessages[0], progress: 0.0))

            // Cycle through progress messages in a child task
            let messageTask = Task {
                let total = analysisMessages.count
                for (index, message) in analysisMessages.enumerated() {
                    guard index > 0 else { continue }
                    let messageProgress = Double(index) / Double(total - 1)
                    let adjusted = min(messageProgress * 0.95, 0.95)
                    try? await Task.sleep(nanoseconds: UInt64.random(in: 4_000_000_000...5_000_000_000))
                    await stageSetter(.analyzing(message: message, progress: adjusted))
                }
            }

            // Make the network call
            let newEntry: AnalyzedFoodData?
            if isTextOnly, let trimmedPrompt = prompt {
                struct TextPromptBody: Encodable { let prompt: String }
                newEntry = try await networkManager.post(
                    endpoint: "/food-entry/analyze-text",
                    body: TextPromptBody(prompt: trimmedPrompt)
                )
            } else {
                newEntry = try await networkManager.postImages(
                    endpoint: "/food-entry/analyze",
                    parameters: prompt.map { ["prompt": $0] },
                    images: imagesToUpload
                )
            }

            messageTask.cancel()
            print("✅ Analysis successful. Server response:", newEntry ?? "Server returned null")

            // Show completed briefly, then hand result to caller
            await stageSetter(.completed)
            try? await Task.sleep(nanoseconds: 600_000_000) // 0.6 seconds

            if let newEntry = newEntry {
                await onComplete(newEntry)
            } else {
                await onError("Analysis complete, but no food data could be extracted.")
            }
        } catch {
            await onError(error.localizedDescription)
        }
    }
}
