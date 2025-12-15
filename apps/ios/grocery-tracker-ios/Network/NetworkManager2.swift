import Foundation

final class NetworkManager2 {
    internal let baseURL: String
    internal let session: URLSession

    init(baseURL: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func get<T: Decodable>(endpoint: String) async throws -> T {
        let request = try createRequest(endpoint, method: "GET")
        return try await sendRequest(request)
    }

    func delete(endpoint: String) async throws -> Bool {
        let request = try createRequest(endpoint, method: "DELETE")
        try await sendRequestWithoutBody(request)
        return true
    }

    func post<T: Encodable, U: Decodable>(endpoint: String, body: T) async throws -> U {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(body)
            let request = try createRequest(endpoint, method: "POST", body: data)
            return try await sendRequest(request)
        } catch {
            throw NetworkError.encodingError(error)
        }
    }

    func patch<T: Encodable, U: Decodable>(endpoint: String, body: T) async throws -> U {
        do {
            let data = try JSONEncoder().encode(body)
            let request = try createRequest(endpoint, method: "PATCH", body: data)
            return try await sendRequest(request)
        } catch {
            throw NetworkError.encodingError(error)
        }

    }

    internal func createRequest(
        _ endpoint: String,
        method: String,
        contentType: String = "application/json",
        body: Data? = nil
    ) throws -> URLRequest {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        if let body = body {
            request.setValue(contentType, forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        return request
    }

    internal func sendRequest<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
            (200...299).contains(httpResponse.statusCode)
        else {
            throw NetworkError.serverError(
                statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0,
                data: data
            )
        }
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }

    internal func sendRequestWithoutBody(_ request: URLRequest) async throws {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
            (200...299).contains(httpResponse.statusCode)
        else {
            throw NetworkError.serverError(
                statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0,
                data: data
            )
        }
    }

}
