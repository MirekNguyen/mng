import SwiftUI
import PhotosUI

struct CameraButton: View {
    @Binding var selectedImage: UIImage?
    @Binding var showError: Bool
    @Binding var isLoadingImage: Bool
    var resetNetwork: () -> Void

    @State private var showCamera: Bool = false
    var body: some View {
        Button {
            showCamera = true
        } label: {
            HStack {
                Image(systemName: "camera.fill")
                Text("Take Photo")
            }
            .font(.headline)
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.accentColor.opacity(0.12))
            .foregroundColor(Color.accentColor)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .disabled(isLoadingImage)
        .opacity(isLoadingImage ? 0.6 : 1.0)
        .sheet(isPresented: $showCamera) {
            CameraPicker { image in
                withAnimation(.easeInOut(duration: 0.2)) {
                    isLoadingImage = true
                }
                
                // Small delay to simulate processing
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        self.selectedImage = image
                        isLoadingImage = false
                    }
                    resetNetwork()
                    showError = false
                }
            }
        }
    }
}
