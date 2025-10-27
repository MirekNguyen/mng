import Foundation

extension NetworkManager2 {
    private func createMultipartBody(
        parameters: [String: String]?,
        imageData: Data,
        boundary: String,
        fileName: String,
        mimeType: String
    ) -> Data {
        var body = Data()
        if let parameters = parameters {
            for (key, value) in parameters {
                body.append(Data("--\(boundary)\r\n".utf8))
                body.append(Data("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".utf8))
                body.append(Data("\(value)\r\n".utf8))
            }
        }
        body.append(Data("--\(boundary)\r\n".utf8))
        body.append(
            Data("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".utf8)
        )
        body.append(Data("Content-Type: \(mimeType)\r\n\r\n".utf8))
        body.append(imageData)
        body.append(Data("\r\n".utf8))
        body.append(Data("--\(boundary)--\r\n".utf8))
        return body
    }

    func postImage<U: Decodable>(
        endpoint: String,
        parameters: [String: String]? = nil,
        imageData: Data,
        fileName: String = "image.jpg",
        mimeType: String = "image/jpeg"
    ) async throws -> U {
        let boundary = UUID().uuidString
        let body = createMultipartBody(
            parameters: parameters, imageData: imageData, boundary: boundary, fileName: fileName,
            mimeType: mimeType)
        let request = try createRequest(
            endpoint,
            method: "POST",
            contentType: "multipart/form-data; boundary=\(boundary)",
            body: body
        )
        return try await sendRequest(request)
    }
}
