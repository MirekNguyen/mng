import Foundation

struct ImageUploadData {
    let data: Data
    let fileName: String
    let mimeType: String
    let formName: String = "images"
}

extension NetworkManager2 {
    private func createMultipartBody(
        parameters: [String: String]?,
        images: [ImageUploadData],
        boundary: String,
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
        for image in images {
            body.append(
                Data("Content-Disposition: form-data; name=\"\(image.formName)\"; filename=\"\(image.fileName)\"\r\n".utf8)
            )
            body.append(Data("Content-Type: \(image.mimeType)\r\n\r\n".utf8))
            body.append(image.data)
            body.append(Data("\r\n".utf8))
        }
        body.append(Data("--\(boundary)--\r\n".utf8))
        return body
    }

    func postImages<U: Decodable>(
        endpoint: String,
        parameters: [String: String]? = nil,
        images: [ImageUploadData],
    ) async throws -> U {
        let boundary = UUID().uuidString
        let body = createMultipartBody(
            parameters: parameters,
            images: images,
            boundary: boundary,
        )
        let request = try createRequest(
            endpoint,
            method: "POST",
            contentType: "multipart/form-data; boundary=\(boundary)",
            body: body
        )
        return try await sendRequest(request)
    }
}
