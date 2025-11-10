import SwiftUI

struct PhotosPreview: View {
    let selectedImages: [UIImage]

    var body: some View {
        if selectedImages.isEmpty {
            EmptyPhotos()
        } else {
            ScrollView(.horizontal, showsIndicators: true) {
                HStack(spacing: 20) {
                    ForEach(selectedImages, id: \.self) { image in
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 200, height: 200)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                    }
                }
                .padding(.horizontal)
            }
            .frame(height: 200)
        }
    }
}

private struct EmptyPhotos: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color.gray.opacity(0.1))
            .frame(height: 200)
            .overlay(
                Text("No images selected")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            )
            .padding(.horizontal)
    }
}
