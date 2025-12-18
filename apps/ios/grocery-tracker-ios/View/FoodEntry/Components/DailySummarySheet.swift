import SwiftUI

struct DailySummarySheet: View {
    let date: Date
    @Environment(\.dismiss) var dismiss
    @State private var summary: String = ""
    @State private var isLoading: Bool = true
    @State private var error: String?
    
    var body: some View {
        NavigationStack {
            ZStack {
                Image("Wallpaper")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .edgesIgnoringSafeArea(.all)
                    .background(Color.black)
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        if isLoading {
                            loadingView
                        } else if let error = error {
                            errorView(message: error)
                        } else {
                            summaryContent
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Daily Summary")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(.white.opacity(0.8))
                            .symbolRenderingMode(.hierarchical)
                    }
                }
            }
            .task {
                await loadSummary()
            }
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
                .tint(.orange)
            
            Text("Analyzing your day...")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }
    
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            
            Text(message)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 100)
    }
    
    private var summaryContent: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 12) {
                Image(systemName: "sparkles")
                    .font(.system(size: 22))
                    .foregroundColor(.orange)
                
                Text(formattedDate)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.primary)
            }
            .padding(.bottom, 4)
            
            ForEach(parseSections(), id: \.title) { section in
                VStack(alignment: .leading, spacing: 8) {
                    if !section.title.isEmpty {
                        Text(section.title)
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(.orange)
                    }
                    
                    Text(section.content)
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(.primary)
                        .lineSpacing(4)
                }
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
        )
    }
    
    private struct Section {
        let title: String
        let content: String
    }
    
    private func parseSections() -> [Section] {
        var sections: [Section] = []
        let lines = summary.components(separatedBy: "\n")
        var currentTitle = ""
        var currentContent = ""
        var hasIntro = false
        
        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            
            if trimmed.isEmpty {
                continue
            }
            
            // Check if line contains a bold section
            if trimmed.contains("**") {
                // Save previous section if exists
                if !currentTitle.isEmpty && !currentContent.isEmpty {
                    sections.append(Section(title: currentTitle, content: currentContent.trimmingCharacters(in: .whitespacesAndNewlines)))
                    currentContent = ""
                    currentTitle = ""
                }
                
                // Extract title from patterns like "**Overview:**" or "1. **Overview**:" or "**Overview**"
                let pattern = #"\*\*([^*]+)\*\*:?"#
                if let regex = try? NSRegularExpression(pattern: pattern),
                   let match = regex.firstMatch(in: trimmed, range: NSRange(trimmed.startIndex..., in: trimmed)) {
                    if let range = Range(match.range(at: 1), in: trimmed) {
                        currentTitle = String(trimmed[range]).trimmingCharacters(in: .whitespaces)
                    }
                }
                
                // Get content after the bold title
                let contentPart = trimmed.replacingOccurrences(of: #"^\d+\.\s*"#, with: "", options: .regularExpression)
                    .replacingOccurrences(of: #"\*\*[^*]+\*\*:?\s*"#, with: "", options: .regularExpression)
                    .trimmingCharacters(in: .whitespaces)
                
                if !contentPart.isEmpty {
                    currentContent = contentPart
                }
            } else {
                // If no title yet and no intro, this is the intro
                if !hasIntro && currentTitle.isEmpty {
                    sections.append(Section(title: "", content: trimmed))
                    hasIntro = true
                } else if !currentTitle.isEmpty {
                    // Add to current section content
                    if !currentContent.isEmpty {
                        currentContent += " "
                    }
                    currentContent += trimmed
                }
            }
        }
        
        // Add last section if exists
        if !currentTitle.isEmpty && !currentContent.isEmpty {
            sections.append(Section(title: currentTitle, content: currentContent.trimmingCharacters(in: .whitespacesAndNewlines)))
        }
        
        return sections
    }
    
    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d, yyyy"
        return formatter.string(from: date)
    }
    
    private func loadSummary() async {
        isLoading = true
        error = nil
        
        do {
            summary = try await streamSummary()
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    private func streamSummary() async throws -> String {
        let baseURL = "https://api.mirekng.com"
        let dateString = ISO8601DateFormatter().string(from: date).split(separator: "T")[0]
        
        guard let url = URL(string: "\(baseURL)/food-entry/summarize?date=\(dateString)") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        
        let (bytes, response) = try await URLSession.shared.bytes(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        var fullText = ""
        
        for try await line in bytes.lines {
            if !line.isEmpty {
                fullText += line + "\n"
                await MainActor.run {
                    summary = fullText.trimmingCharacters(in: .whitespacesAndNewlines)
                    isLoading = false
                }
            }
        }
        
        if fullText.isEmpty {
            throw URLError(.cannotParseResponse)
        }
        
        return fullText.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
