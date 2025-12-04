import PhotosUI
import SwiftUI

struct ImageUploadView: View {
    @EnvironmentObject var repository: FoodEntryRepository
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedImages: [UIImage] = []
    @State private var isLoading: Bool = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                PhotosPreview(selectedImages: selectedImages)
                // MARK: - Photos Picker
                PhotosPicker(
                    selection: $selectedItems,
                    maxSelectionCount: 5,
                    matching: .images
                ) {
                    Label("Select Images", systemImage: "photo.on.rectangle.angled")
                        .frame(maxWidth: .infinity)
                        .frame(height: 36)
                }
                .buttonStyle(.glass)
                .padding(.horizontal)

                // MARK: - Analyze/Upload Button
                Button(action: analyzeSelectedImages) {
                    if isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .frame(height: 36)
                    } else {
                        Label("Analyze Meal", systemImage: "sparkle.magnifyingglass")
                            .frame(maxWidth: .infinity)
                            .frame(height: 36)
                    }
                }
                .buttonStyle(.glass)
                .disabled(selectedImages.isEmpty || isLoading)
                .padding(.horizontal)

                // MARK: - Error Message
                if let errorMessage = repository.errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding()
                }

                Spacer()
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel", systemImage: "xmark", action: { dismiss() })
                }
            }
            .navigationTitle("Analyze New Meal")
            .onChange(of: selectedItems) { _, newItems in
                Task {
                    await MainActor.run { repository.errorMessage = nil }
                    await loadImages(from: newItems)
                }
            }
            // --- MODIFICATION ---
            // Changed .sheet to .fullScreenCover
            .fullScreenCover(item: $repository.pendingEntry) { entryData in
                // This content is now presented full-screen
                ConfirmEntryView(data: entryData, repository: repository)
            }
        }
    }

    /// Asynchronously loads the selected PhotosPickerItems into UIImages
    private func loadImages(from items: [PhotosPickerItem]) async {
        var images: [UIImage] = []
        await withTaskGroup(of: UIImage?.self) { group in
            for item in items {
                group.addTask {
                    do {
                        if let data = try await item.loadTransferable(type: Data.self) {
                            return UIImage(data: data)
                        }
                    } catch {
                        print("Failed to load image: \(error)")
                    }
                    return nil
                }
            }
            for await image in group {
                if let image = image {
                    images.append(image)
                }
            }
        }

        await MainActor.run {
            self.selectedImages = images
        }
    }

    /// Calls the repository to upload the loaded images
    private func analyzeSelectedImages() {
        isLoading = true
        Task {
            await repository.analyzeImages(images: selectedImages)

            await MainActor.run {
                isLoading = false
                if repository.errorMessage == nil {
                    selectedItems = []
                    selectedImages = []
                }
            }
        }
    }
}
