import PhotosUI
import SwiftUI

struct ImageUploader: View {
    @EnvironmentObject var networkManager: NetworkManager
    @Binding var selectedTab: Int
    @State private var selectedItem: PhotosPickerItem? = nil
    @State private var selectedImage: UIImage? = nil
    @State private var showError: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack {
                    // App logo or icon for branding
                    Image(systemName: "cart.fill")
                        .resizable()
                        .scaledToFit()
                        .foregroundColor(.accentColor)
                        .frame(width: 56, height: 56)
                        .padding(.top, 32)
                    Text("Grocery Receipt Analyzer")
                        .font(.title2).bold()
                        .foregroundColor(.primary)

                    Text("Upload your receipt and get spend analytics right away!")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.bottom, 10)

                // Image Preview Card
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(.systemBackground))
                        .shadow(color: .black.opacity(0.07), radius: 12, x: 0, y: 4)

                    if let image = selectedImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(height: 220)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .padding()
                    } else {
                        VStack {
                            Image(systemName: "photo.on.rectangle.angled")
                                .font(.system(size: 48))
                                .foregroundColor(.gray.opacity(0.4))
                            Text("No image selected")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.top, 2)
                        }
                        .padding(.vertical, 32)
                    }
                }
                .frame(height: 250)
                .padding(.horizontal)

                // Image picker and upload buttons
                VStack(spacing: 12) {
                    CameraButton(
                        selectedImage: $selectedImage,
                        showError: $showError,
                        resetNetwork: { networkManager.errorMessage = nil }
                    )
                    PhotosPicker(
                        selection: $selectedItem,
                        matching: .images,
                        photoLibrary: .shared()
                    ) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                            Text("Select Receipt Photo")
                        }
                        .font(.headline)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.accentColor.opacity(0.12))
                        .foregroundColor(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    if let image = selectedImage {
                        if networkManager.isLoading {
                            ProgressView("Analyzing...")
                                .progressViewStyle(CircularProgressViewStyle(tint: .accentColor))
                                .padding()
                        } else {
                            Button(action: {
                                Task {
                                    await networkManager.uploadReceiptImage(image)
                                    if networkManager.errorMessage == nil {
                                        selectedTab = 1
                                    } else {
                                        withAnimation { showError = true }
                                    }
                                }
                            }) {
                                HStack {
                                    Image(systemName: "tray.and.arrow.up.fill")
                                    Text("Upload & Analyze")
                                }
                                .font(.headline)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.green)
                                .foregroundColor(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .shadow(color: .green.opacity(0.18), radius: 5, x: 0, y: 2)
                            }
                            .padding(.top, 2)
                        }
                    }
                }
                .padding(.horizontal)

                // Error Banner
                if let error = networkManager.errorMessage, showError {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.white)
                        ScrollView(.horizontal) {
                            Text(error)
                                .font(.callout)
                                .foregroundColor(.white)
                        }
                        Spacer()
                        Button {
                            withAnimation { showError = false }
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.white)
                                .font(.title2.bold())
                        }
                    }
                    .padding(12)
                    .background(Color.red.opacity(0.93))
                    .cornerRadius(15)
                    .padding(.horizontal)
                    .padding(.top, 4)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
            .padding(.vertical)
        }
        .background(Color(.systemGroupedBackground).ignoresSafeArea())
        .onChange(of: selectedItem) {
            if let selectedItem {
                Task {
                    if let data = try? await selectedItem.loadTransferable(type: Data.self),
                        let uiImage = UIImage(data: data)
                    {
                        selectedImage = uiImage
                        networkManager.errorMessage = nil
                        showError = false
                    }
                }
            }
        }
        .animation(.easeInOut, value: showError)
    }
}
