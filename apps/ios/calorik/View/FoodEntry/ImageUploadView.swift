import PhotosUI
import SwiftUI

struct ImageUploadView: View {
    @EnvironmentObject var repository: FoodEntryRepository
    @Environment(\.dismiss) private var dismiss

    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedImages: [UIImage] = []
    @State private var showCamera: Bool = false
    @State private var mealPrompt: String = ""

    var body: some View {
        NavigationStack {
            ZStack {
                VStack(spacing: 0) {
                    ScrollView {
                        VStack(spacing: 16) {
                            if selectedImages.isEmpty {
                                emptyStateView
                                    .padding(.top, 24)
                            } else {
                                imagePreviewGrid
                                    .padding(.top, 16)
                            }

                            // Meal prompt input — always visible, appears below photo area
                            MealPromptTextField(
                                text: $mealPrompt,
                                isBusy: repository.analysisStage != .idle
                            )
                            .padding(.horizontal, 20)
                            .padding(.bottom, 8)
                        }
                    }
                    .scrollDismissesKeyboard(.interactively)

                    if let error = repository.errorMessage {
                        errorView(message: error)
                            .padding(.horizontal, 20)
                            .padding(.top, 8)
                    }

                    actionButtons
                        .padding(.horizontal, 20)
                        .padding(.vertical, 20)
                }
                
                // Overlay the progress view when analyzing
                if repository.analysisStage != .idle {
                    Color.black.opacity(0.4)
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
                    Button(action: {
                        dismiss()
                    }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                            .symbolRenderingMode(.hierarchical)
                    }
                    .disabled(repository.analysisStage != .idle && repository.analysisStage != .failed(error: ""))
                }
            }
            .onChange(of: selectedItems) { _, newItems in
                Task {
                    await loadImages(from: newItems)
                }
            }
            .sheet(isPresented: $showCamera) {
                CameraPicker { image in
                    if selectedImages.count < 5 {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedImages.append(image)
                        }
                        repository.errorMessage = nil
                    }
                }
            }
        }
    }

    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "camera.metering.center.weighted")
                .font(.system(size: 72))
                .foregroundStyle(.blue.gradient)
                .symbolEffect(.pulse)
            
            VStack(spacing: 8) {
                Text("No Images Selected")
                    .font(.title2.bold())
                    .foregroundColor(.primary)
                
                Text("Add a photo, type a description, or both — to help the AI analyze your meal accurately.")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
        }
        .padding()
    }

    private var imagePreviewGrid: some View {
        LazyVGrid(
            columns: [
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12)
            ],
            spacing: 12
        ) {
            ForEach(Array(selectedImages.enumerated()), id: \.offset) { index, image in
                GeometryReader { geo in
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: geo.size.width, height: geo.size.width)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(.systemGray5), lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
                        .overlay(alignment: .topTrailing) {
                            Button {
                                removeImage(at: index)
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.title3)
                                    .foregroundStyle(.white, Color.black.opacity(0.6))
                                    .symbolRenderingMode(.palette)
                            }
                            .disabled(repository.analysisStage != .idle)
                            .padding(6)
                        }
                }
                .aspectRatio(1, contentMode: .fit)
                .transition(.asymmetric(
                    insertion: .scale.combined(with: .opacity),
                    removal: .opacity
                ))
            }
        }
        .padding(.horizontal, 20)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: selectedImages.count)
    }

    private func removeImage(at index: Int) {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            selectedImages.remove(at: index)
            // Do not modify selectedItems here — selectedImages is the source of
            // truth for analysis once images are loaded. Mutating selectedItems
            // would trigger onChange → loadImages and overwrite selectedImages,
            // losing any camera-captured photos that have no PhotosPickerItem.
        }
    }

    private var canAnalyze: Bool {
        !selectedImages.isEmpty || !mealPrompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var actionButtons: some View {
        VStack(spacing: 12) {
            if !selectedImages.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "photo.stack")
                        .foregroundColor(.secondary)
                    Text("\(selectedImages.count) image\(selectedImages.count == 1 ? "" : "s") selected")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("Max 5")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 4)
            }
            
            HStack(spacing: 12) {
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
                    .lineLimit(1)
                }
                .buttonStyle(.bordered)
                .controlSize(.regular)
                .disabled(repository.analysisStage != .idle || selectedImages.count >= 5)

                if UIImagePickerController.isSourceTypeAvailable(.camera) {
                    Button {
                        showCamera = true
                    } label: {
                        Label("Camera", systemImage: "camera.fill")
                            .frame(maxWidth: .infinity)
                            .lineLimit(1)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.regular)
                    .disabled(repository.analysisStage != .idle || selectedImages.count >= 5)
                }
            }

            Button(action: analyzeSelectedImages) {
                Label("Analyze Meal", systemImage: "sparkle.magnifyingglass")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.blue)
            .controlSize(.large)
            .disabled(!canAnalyze || repository.analysisStage != .idle)
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
        let trimmedPrompt = mealPrompt.trimmingCharacters(in: .whitespacesAndNewlines)
        let imagesToAnalyze = selectedImages
        let promptToSend = trimmedPrompt.isEmpty ? nil : trimmedPrompt

        // Start background analysis — the sheet dismisses immediately so the
        // user can continue using the app while the AI works.
        Task {
            await repository.analyzeImages(
                images: imagesToAnalyze,
                prompt: promptToSend,
                background: true
            )
        }

        // Dismiss right away (don't wait for analysis to finish).
        dismiss()
    }
}
