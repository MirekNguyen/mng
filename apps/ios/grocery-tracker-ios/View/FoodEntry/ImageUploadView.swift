import PhotosUI
import SwiftUI

struct ImageUploadView: View {
    @EnvironmentObject var repository: FoodEntryRepository
    @Environment(\.dismiss) private var dismiss

    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedImages: [UIImage] = []

    var body: some View {
        NavigationStack {
            ZStack {
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
                
                // Overlay the progress view when analyzing
                if repository.analysisStage != .idle {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                        .transition(.opacity)
                    
                    AnalysisProgressView(stage: repository.analysisStage)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .animation(.easeInOut(duration: 0.3), value: repository.analysisStage != .idle)
            .navigationTitle("Analyze New Meal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(repository.analysisStage != .idle && repository.analysisStage != .failed(error: ""))
                }
            }
            .onChange(of: selectedItems) { _, newItems in
                Task {
                    await loadImages(from: newItems)
                }
            }
            .fullScreenCover(item: $repository.pendingEntry) { entryData in
                ConfirmEntryView(data: entryData, repository: repository, onSave: {
                    dismiss()
                })
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
                        .scaleEffect(1.0)
                        .transition(.asymmetric(insertion: .scale.combined(with: .opacity), removal: .opacity))
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
            .disabled(repository.analysisStage != .idle)

            Button(action: analyzeSelectedImages) {
                Label("Analyze Meal", systemImage: "sparkle.magnifyingglass")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.blue)
            .controlSize(.large)
            .disabled(selectedImages.isEmpty || repository.analysisStage != .idle)
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
        Task {
            await repository.analyzeImages(images: selectedImages)

            await MainActor.run {
                if repository.errorMessage == nil {
                    selectedItems = []
                    selectedImages = []
                }
            }
        }
    }
}
