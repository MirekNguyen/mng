import Combine
import Foundation
import UIKit

// MARK: - NetworkManager

final class NetworkManager: ObservableObject {
    static let shared = NetworkManager()
    private init() {}
    // MARK: Configuration
    // Set your base URL here (e.g., http://192.168.1.10:3000 for device testing)
    private let baseURL = URL(string: "https://ysgw44w44gckoocg0o0ggss4.mirekng.com")!  // e.g. http://192.168.1.10:3000
    private var receiptsURL: URL { baseURL.appendingPathComponent("receipts") }
    private func receiptURL(_ id: Int) -> URL { receiptsURL.appendingPathComponent("\(id)") }
    private var uploadURL: URL { baseURL.appendingPathComponent("receipts/analyze") }

    // Optional auth (e.g., bearer token). Set if needed.
    var authorizationToken: String?

    // MARK: Published state
    @Published var receipts: [Receipt] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    // MARK: JSON Coders
    private lazy var decoder: JSONDecoder = {
        let jsonDecoder = JSONDecoder()
        // Robust ISO8601 decoding with/without fractional seconds, plus timestamp fallback
        jsonDecoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            if let date = NetworkManager.iso8601WithFractional.date(from: dateString) {
                return date
            }
            if let date = NetworkManager.iso8601Basic.date(from: dateString) { return date }
            if let timeInterval = TimeInterval(dateString) {
                return Date(timeIntervalSince1970: timeInterval)
            }
            throw DecodingError.dataCorruptedError(
                in: container, debugDescription: "Invalid date: \(dateString)")
        }
        return jsonDecoder
    }()

    private lazy var encoder: JSONEncoder = {
        let jsonEncoder = JSONEncoder()
        // Encode dates as ISO8601 with fractional seconds
        jsonEncoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            let string = NetworkManager.iso8601WithFractional.string(from: date)
            try container.encode(string)
        }
        return jsonEncoder
    }()

    private static let iso8601WithFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let iso8601Basic: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    // MARK: Public API

    @MainActor
    func clearError() { errorMessage = nil }

    // GET /receipts
    func fetchReceipts() async {
        setLoading(true)
        defer { Task { self.setLoading(false) } }

        var request = URLRequest(url: receiptsURL)
        request.httpMethod = "GET"
        addCommonHeaders(to: &request)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            try validate(response: response, data: data)

            let decoded = try decoder.decode([Receipt].self, from: data)
            await MainActor.run {
                self.receipts = decoded.sorted { $0.date > $1.date }
            }
        } catch {
            handle(error: error)
        }
    }

    // POST /receipts/analyze (multipart) → server saves → refresh receipts
    func uploadReceiptImage(_ image: UIImage) async {
        setLoading(true)
        defer { Task { self.setLoading(false) } }

        guard let imageData = image.jpegData(compressionQuality: 0.85) else {
            handle(error: APIError.message("Failed to create JPEG data from image"))
            return
        }

        var request = URLRequest(url: uploadURL)
        request.httpMethod = "POST"
        addCommonHeaders(to: &request, acceptJSON: true, contentType: nil)

        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue(
            "multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"receipt.jpg\"\r\n")
        body.append("Content-Type: image/jpeg\r\n\r\n")
        body.append(imageData)
        body.append("\r\n")
        body.append("--\(boundary)--\r\n")

        do {
            let (data, response) = try await URLSession.shared.upload(for: request, from: body)
            try validate(response: response, data: data)
            // Stay consistent with server state
            await fetchReceipts()
        } catch {
            handle(error: error)
        }
    }

    // DELETE /receipts/{id} with optimistic UI + rollback
    func deleteReceipt(_ receipt: Receipt) async {
        // Snapshot previous state
        let previous = await MainActor.run { self.receipts }

        // Optimistically remove
        await MainActor.run {
            self.receipts.removeAll { $0.id == receipt.id }
        }

        var request = URLRequest(url: receiptURL(receipt.id))
        request.httpMethod = "DELETE"
        addCommonHeaders(to: &request)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            try validate(response: response, data: data)
            // success: nothing more to do
        } catch {
            // Rollback on failure
            await MainActor.run { self.receipts = previous }
            handle(error: error)
        }
    }

    // PUT /receipts/{id} with optimistic UI + rollback
    // Expects a ReceiptDraft (see earlier message) and server returns updated Receipt
    func updateReceipt(_ draft: ReceiptDraft) async {
        // Take a snapshot for rollback
        let previous = await MainActor.run { self.receipts }

        // Optimistic local update (temporary model from draft)
        await MainActor.run {
            let tempReceipt = draft.asTemporaryReceipt()
            if let idx = self.receipts.firstIndex(where: { $0.id == draft.id }) {
                self.receipts[idx] = tempReceipt
            } else {
                self.receipts.insert(tempReceipt, at: 0)
            }
        }

        var request = URLRequest(url: receiptURL(draft.id))
        request.httpMethod = "PUT"
        addCommonHeaders(to: &request, acceptJSON: true, contentType: "application/json")

        do {
            let body = try encoder.encode(draft)
            let (data, response) = try await URLSession.shared.upload(for: request, from: body)
            try validate(response: response, data: data)

            if data.isEmpty {
                // If server returns no content, refetch to sync
                await fetchReceipts()
                return
            }

            // Replace with server-updated version
            let updated = try decoder.decode(Receipt.self, from: data)
            await MainActor.run {
                if let idx = self.receipts.firstIndex(where: { $0.id == updated.id }) {
                    self.receipts[idx] = updated
                } else {
                    self.receipts.insert(updated, at: 0)
                }
            }
        } catch {
            // Rollback on failure
            await MainActor.run { self.receipts = previous }
            handle(error: error)
        }
    }

    // MARK: - Helpers

    private func addCommonHeaders(
        to request: inout URLRequest, acceptJSON: Bool = true, contentType: String? = nil
    ) {
        if acceptJSON {
            request.addValue("application/json", forHTTPHeaderField: "Accept")
        }
        if let contentType {
            request.addValue(contentType, forHTTPHeaderField: "Content-Type")
        }
        if let token = authorizationToken, !token.isEmpty {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? "<no body>"
            throw APIError.server(status: http.statusCode, body: text)
        }
    }

    @MainActor
    private func setLoading(_ loading: Bool) {
        isLoading = loading
    }

    @MainActor
    private func handle(error: Error) {
        print("Network error:", error)
        if let apiError = error as? APIError {
            errorMessage = apiError.localizedDescription
        } else if let decoding = error as? DecodingError {
            errorMessage = "Decoding error: \(decoding)"
        } else {
            errorMessage = error.localizedDescription
        }
    }

}

// MARK: - Data helpers

extension Data {
    fileprivate mutating func append(_ string: String) {
        if let d = string.data(using: .utf8) { append(d) }
    }
}

// MARK: - APIError

enum APIError: LocalizedError {
    case server(status: Int, body: String)
    case message(String)
    var errorDescription: String? {
        switch self {
        case .server(let status, let body):
            return "Server error (\(status)):\n\(body)"
        case .message(let msg):
            return msg
        }
    }

}

// Payloads used only for create
struct CreateReceiptPayload: Codable {
    let total: Double
    let date: Date
    let currency: String
    let storeName: String?
    let receiptItem: [CreateReceiptItemPayload]
}

struct CreateReceiptItemPayload: Codable {
    let date: Date?
    let name: String
    let description: String?
    let category: ReceiptItemCategory
    let unit: String?
    let price: Double
    let quantity: Double?
    let priceTotal: Double
}

extension NetworkManager {
    // POST /receipts → returns created Receipt
    func createReceipt(_ draft: NewReceiptDraft) async -> Receipt? {
        var request = URLRequest(url: receiptsURL)
        request.httpMethod = "POST"
        addCommonHeaders(to: &request, acceptJSON: true, contentType: "application/json")
        let payload = CreateReceiptPayload(
            total: draft.total,
            date: draft.date,
            currency: draft.currency,
            storeName: draft.storeName,
            receiptItem: draft.items.map { it in
                CreateReceiptItemPayload(
                    date: it.date,
                    name: it.name,
                    description: it.description,
                    category: it.category,
                    unit: it.unit,
                    price: it.price,
                    quantity: it.quantity,
                    priceTotal: it.priceTotal
                )
            }
        )

        do {
            let body = try encoder.encode(payload)
            let (data, response) = try await URLSession.shared.upload(for: request, from: body)
            try validate(response: response, data: data)

            let created = try decoder.decode(Receipt.self, from: data)
            await MainActor.run {
                // Insert newest at the top
                self.receipts.insert(created, at: 0)
            }
            return created
        } catch {
            handle(error: error)
            return nil
        }
    }

}
