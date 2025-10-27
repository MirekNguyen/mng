import SwiftUI
import PhotosUI

struct CameraButton: View {
    @Binding var selectedImage: UIImage?
    @Binding var showError: Bool
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
        .sheet(isPresented: $showCamera) {
            CameraPicker { image in
                self.selectedImage = image
                resetNetwork()
                showError = false
            }
        }
    }
}
