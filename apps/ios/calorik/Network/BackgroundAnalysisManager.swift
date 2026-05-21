import Combine
import Foundation
import UIKit
import UserNotifications

final class BackgroundAnalysisManager: NSObject, ObservableObject, URLSessionDataDelegate {
    static let shared = BackgroundAnalysisManager()

    @Published var isAnalyzing: Bool = false
    @Published var stage: AnalysisStage = .idle
    @Published var pendingResult: AnalyzedFoodData?
    @Published var error: String?

    private var backgroundSession: URLSession!
    private var backgroundTaskID: UIBackgroundTaskIdentifier = .invalid
    private var receivedData = Data()
    private var completionHandler: (() -> Void)?

    private override init() {
        super.init()
        let config = URLSessionConfiguration.background(withIdentifier: "com.calorik.analysis")
        config.sessionSendsLaunchEvents = true
        config.isDiscretionary = false
        config.shouldUseExtendedBackgroundIdleMode = true
        backgroundSession = URLSession(configuration: config, delegate: self, delegateQueue: .main)
    }

    // MARK: - Public API

    func analyzeImages(images: [UIImage], prompt: String?) {
        let hasImages = !images.isEmpty
        let hasPrompt = prompt != nil && !(prompt!.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        guard hasImages || hasPrompt else {
            error = "Please add a photo or describe your meal."
            return
        }

        isAnalyzing = true
        stage = .preparing
        error = nil
        pendingResult = nil
        receivedData = Data()

        // Request extended background execution time
        backgroundTaskID = UIApplication.shared.beginBackgroundTask { [weak self] in
            self?.endBackgroundTask()
        }

        let isTextOnly = images.isEmpty

        if isTextOnly, let trimmedPrompt = prompt?.trimmingCharacters(in: .whitespacesAndNewlines) {
            startTextAnalysis(prompt: trimmedPrompt)
        } else {
            startImageAnalysis(images: images, prompt: prompt)
        }

        // Start simulated progress
        simulateProgress(isTextOnly: isTextOnly)
    }

    func clearResult() {
        pendingResult = nil
    }

    func reset() {
        isAnalyzing = false
        stage = .idle
        pendingResult = nil
        error = nil
    }

    // MARK: - Notifications

    func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    private func sendCompletionNotification(success: Bool) {
        let content = UNMutableNotificationContent()
        if success {
            content.title = "Meal analyzed"
            content.body = "Tap to review and save your meal."
            content.sound = .default
        } else {
            content.title = "Analysis failed"
            content.body = "Something went wrong. Try again."
            content.sound = .default
        }

        let request = UNNotificationRequest(
            identifier: "analysis-complete",
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(request)
    }

    private var shouldNotify: Bool {
        UIApplication.shared.applicationState != .active
    }

    // MARK: - Network Requests

    private func startTextAnalysis(prompt: String) {
        stage = .analyzing(message: "Reading your description...", progress: 0.0)

        struct TextPromptBody: Encodable { let prompt: String }
        guard let url = URL(string: "https://api.mirekng.com/food-entry/analyze-text") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        guard let body = try? JSONEncoder().encode(TextPromptBody(prompt: prompt)) else { return }

        // For text-only, use a foreground data task with background task protection
        // (background URLSession requires file uploads, text payloads are tiny and fast)
        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.handleResponse(data: data, response: response, error: error)
            }
        }
        request.httpBody = body
        // Re-create with body
        var req2 = URLRequest(url: url)
        req2.httpMethod = "POST"
        req2.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req2.httpBody = body

        let dataTask = URLSession.shared.dataTask(with: req2) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.handleResponse(data: data, response: response, error: error)
            }
        }
        dataTask.resume()
        _ = task // suppress warning
    }

    private func startImageAnalysis(images: [UIImage], prompt: String?) {
        stage = .uploading(progress: 0.0)

        let boundary = UUID().uuidString
        guard let url = URL(string: "https://api.mirekng.com/food-entry/analyze") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        // Build multipart body
        var body = Data()

        if let prompt = prompt?.trimmingCharacters(in: .whitespacesAndNewlines), !prompt.isEmpty {
            body.append(Data("--\(boundary)\r\n".utf8))
            body.append(Data("Content-Disposition: form-data; name=\"prompt\"\r\n\r\n".utf8))
            body.append(Data("\(prompt)\r\n".utf8))
        }

        for image in images {
            guard let imageData = image.jpegData(compressionQuality: 0.8) else { continue }
            let fileName = "\(UUID().uuidString).jpg"
            body.append(Data("--\(boundary)\r\n".utf8))
            body.append(Data("Content-Disposition: form-data; name=\"files\"; filename=\"\(fileName)\"\r\n".utf8))
            body.append(Data("Content-Type: image/jpeg\r\n\r\n".utf8))
            body.append(imageData)
            body.append(Data("\r\n".utf8))
        }

        body.append(Data("--\(boundary)--\r\n".utf8))

        // Write to temp file for background upload
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).multipart")
        try? body.write(to: tempURL)

        let uploadTask = backgroundSession.uploadTask(with: request, fromFile: tempURL)
        uploadTask.resume()
    }

    // MARK: - Response Handling

    private func handleResponse(data: Data?, response: URLResponse?, error: Error?) {
        if let error = error {
            finishWithError(error.localizedDescription)
            return
        }

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode),
              let data = data else {
            finishWithError("Server returned an error.")
            return
        }

        decodeResult(from: data)
    }

    private func decodeResult(from data: Data) {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        if let result = try? decoder.decode(AnalyzedFoodData.self, from: data) {
            stage = .completed
            isAnalyzing = false
            pendingResult = result

            if shouldNotify {
                sendCompletionNotification(success: true)
            }
        } else {
            finishWithError("Could not read the analysis result.")
        }

        endBackgroundTask()
    }

    private func finishWithError(_ message: String) {
        stage = .failed(error: message)
        isAnalyzing = false
        error = message

        if shouldNotify {
            sendCompletionNotification(success: false)
        }

        endBackgroundTask()
    }

    private func endBackgroundTask() {
        if backgroundTaskID != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskID)
            backgroundTaskID = .invalid
        }
    }

    // MARK: - Progress Simulation

    private func simulateProgress(isTextOnly: Bool) {
        let messages: [String] = isTextOnly ? [
            "Reading your description...",
            "Looking up nutritional data...",
            "Estimating calories and macros...",
            "Finalizing analysis..."
        ] : [
            "Uploading images...",
            "Identifying food items...",
            "Analyzing portions...",
            "Calculating nutrition...",
            "Finalizing..."
        ]

        Task { @MainActor in
            for (index, message) in messages.enumerated() {
                guard isAnalyzing else { return }
                let progress = Double(index) / Double(messages.count - 1) * 0.9
                if isTextOnly || index > 0 {
                    stage = .analyzing(message: message, progress: progress)
                }
                try? await Task.sleep(nanoseconds: UInt64.random(in: 3_000_000_000...5_000_000_000))
            }
        }
    }

    // MARK: - URLSessionDataDelegate

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        receivedData.append(data)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            DispatchQueue.main.async { self.finishWithError(error.localizedDescription) }
            return
        }

        DispatchQueue.main.async { self.decodeResult(from: self.receivedData) }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didSendBodyData bytesSent: Int64, totalBytesSent: Int64, totalBytesExpectedToSend: Int64) {
        let progress = Double(totalBytesSent) / Double(totalBytesExpectedToSend)
        DispatchQueue.main.async {
            self.stage = .uploading(progress: progress)
        }
    }

    // Called when background session finishes events (app was relaunched)
    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        DispatchQueue.main.async {
            self.completionHandler?()
            self.completionHandler = nil
        }
    }

    func setCompletionHandler(_ handler: @escaping () -> Void) {
        completionHandler = handler
    }
}
