import Combine
import Foundation
import UIKit

final class ReceiptRepository: ObservableObject {
    @Published var receipts: [Receipt]?
    @Published var errorMessage: String?

    private let networkManager: NetworkManager2

    init(networkManager: NetworkManager2) {
        self.networkManager = networkManager
    }

    func fetchReceipt() async {
        print("Fetching receipts")
        do {
            let fetched: [Receipt] = try await networkManager.get(endpoint: "/receipts")
            await MainActor.run { self.receipts = fetched }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
        }
    }
    func analyzeImage(image: UIImage) async {
        do {
            guard let imageData = image.jpegData(compressionQuality: 0.85) else {
                await MainActor.run {
                    self.errorMessage = "Failed to generate image data from UIImage."
                }
                return
            }
            let image = ImageUploadData(
                data: imageData, fileName: "image.jpg", mimeType: "image/jpeg"
            )
            let fetched: [Receipt] = try await networkManager.postImages(
                endpoint: "/receipts/analyze",
                images: [image]
            )
            await MainActor.run {
                self.receipts = fetched
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
        }
    }
}
