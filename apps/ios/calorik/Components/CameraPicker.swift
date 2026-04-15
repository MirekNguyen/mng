import SwiftUI

struct CameraPicker: UIViewControllerRepresentable {
    var allowsEditing = true
    var onImagePicked: (UIImage) -> Void
    @Environment(\.presentationMode) var presentationMode

    final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: CameraPicker

        init(_ parent: CameraPicker) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            var img: UIImage? = nil
            if parent.allowsEditing {
                img = info[.editedImage] as? UIImage
            }
            if img == nil {
                img = info[.originalImage] as? UIImage
            }
            if let img = img {
                parent.onImagePicked(img)
            }
            parent.presentationMode.wrappedValue.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.presentationMode.wrappedValue.dismiss()
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.allowsEditing = allowsEditing
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
}
