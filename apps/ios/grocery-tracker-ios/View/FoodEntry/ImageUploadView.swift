import PhotosUI
import SwiftUI

struct ImageUploadView: View {
    @EnvironmentObject var repository: FoodEntryRepository
    @Environment(\.dismiss) private var dismiss

    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedImages: [UIImage] = []
    @State private var isLoading: Bool = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                if selectedImages.isEmpty {
                    emptyStateView
                } else {
                    imagePreviewList
                }

                Spacer()

                if let error = repository.errorMessage {
                    errorView(message: error)
                }

                actionButtons
            }
            .padding()
            .navigationTitle("Analyze New Meal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .onChange(of: selectedItems) { _, newItems in
                Task {
                    await loadImages(from: newItems)
                }
            }
            .fullScreenCover(item: $repository.pendingEntry) { entryData in
                ConfirmEntryView(data: entryData, repository: repository)
            }
        }
    }

    private var emptyStateView: some View {
        ContentUnavailableView(
            "No Images Selected",
            systemImage: "photo.badge.plus",
            description: Text("Select photos of your food to begin analysis.")
        )
    }

    private var imagePreviewList: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(selectedImages, id: \.self) { image in
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 200, height: 200)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .shadow(radius: 4)
                }
            }
            .padding(.horizontal, 4)
        }
        .frame(height: 220)
    }

    private var actionButtons: some View {
        VStack(spacing: 16) {
            PhotosPicker(
                selection: $selectedItems,
                maxSelectionCount: 5,
                matching: .images
            ) {
                Label(
                    selectedImages.isEmpty ? "Select Images" : "Change Selection",
                    systemImage: "photo.on.rectangle"
                )
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .controlSize(.large)

            Button(action: analyzeSelectedImages) {
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Label("Analyze Meal", systemImage: "sparkle.magnifyingglass")
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(selectedImages.isEmpty || isLoading)
        }
    }

    private func errorView(message: String) -> some View {
        Text(message)
            .font(.footnote)
            .foregroundStyle(.red)
            .multilineTextAlignment(.center)
            .padding(.horizontal)
            .transition(.opacity)
    }

    private func loadImages(from items: [PhotosPickerItem]) async {
        repository.errorMessage = nil

        await withTaskGroup(of: UIImage?.self) { group in
            for item in items {
                group.addTask {
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        return UIImage(data: data)
                    }
                    return nil
                }
            }

            var images: [UIImage] = []
            for await image in group {
                if let image {
                    images.append(image)
                }
            }

            let finalImages = images
            await MainActor.run {
                self.selectedImages = finalImages
            }
        }
    }

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
