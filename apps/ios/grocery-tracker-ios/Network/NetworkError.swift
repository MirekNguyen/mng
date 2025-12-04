import Foundation

enum NetworkError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int, data: Data?)
    case decodingError(Error)
    case encodingError(Error)
    case noData
    case underlying(Error)
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL provided."
        case .invalidResponse:
            return "Invalid response from server."
        case .serverError(let statusCode, let data):
            var msg = "Server error with status code: \(statusCode)."
            if let data, let raw = String(data: data, encoding: .utf8), !raw.isEmpty {
                print("Server error response body:", raw)
                msg += "\n\(raw)"
            }
            return msg
        case .decodingError(let error):
            return "Decoding failed: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Encoding failed: \(error.localizedDescription)"
        case .noData:
            return "No data was received."
        case .underlying(let err):
            return err.localizedDescription
        }
    }
}
