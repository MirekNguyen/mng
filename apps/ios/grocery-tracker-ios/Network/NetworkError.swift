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
            if let decodingError = error as? DecodingError {
                return "Decoding failed: \(decodingError.detailedDescription)"
            }
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

extension DecodingError {
    var detailedDescription: String {
        switch self {
        case .typeMismatch(let type, let context):
            return "Type mismatch: Expected \(type), at path: \(context.codingPath.map { $0.stringValue }.joined(separator: ".")). Debug: \(context.debugDescription)"
        case .valueNotFound(let type, let context):
            return "Value not found: Expected \(type), at path: \(context.codingPath.map { $0.stringValue }.joined(separator: ".")). Debug: \(context.debugDescription)"
        case .keyNotFound(let key, let context):
            return "Key not found: '\(key.stringValue)', at path: \(context.codingPath.map { $0.stringValue }.joined(separator: ".")). Debug: \(context.debugDescription)"
        case .dataCorrupted(let context):
            return "Data corrupted at path: \(context.codingPath.map { $0.stringValue }.joined(separator: ".")). Debug: \(context.debugDescription)"
        @unknown default:
            return localizedDescription
        }
    }
}
