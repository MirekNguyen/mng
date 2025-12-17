import Foundation

enum AnalysisStage: Equatable {
    case idle
    case preparing
    case uploading(progress: Double)
    case analyzing(message: String, progress: Double)
    case completed
    case failed(error: String)
    
    var title: String {
        switch self {
        case .idle:
            return ""
        case .preparing:
            return "Preparing Images"
        case .uploading:
            return "Uploading"
        case .analyzing:
            return "Analyzing Food"
        case .completed:
            return "Complete"
        case .failed:
            return "Failed"
        }
    }
    
    var message: String {
        switch self {
        case .idle:
            return ""
        case .preparing:
            return "Optimizing images for analysis..."
        case .uploading(let progress):
            return "Uploading to server... \(Int(progress * 100))%"
        case .analyzing(let message, _):
            return message
        case .completed:
            return "Analysis complete!"
        case .failed(let error):
            return error
        }
    }
    
    var systemImage: String {
        switch self {
        case .idle:
            return ""
        case .preparing:
            return "photo.badge.arrow.down"
        case .uploading:
            return "icloud.and.arrow.up"
        case .analyzing:
            return "sparkle.magnifyingglass"
        case .completed:
            return "checkmark.circle.fill"
        case .failed:
            return "exclamationmark.triangle.fill"
        }
    }
    
    var progress: Double {
        switch self {
        case .idle:
            return 0.0
        case .preparing:
            return 0.15
        case .uploading(let progress):
            return 0.15 + (progress * 0.25)  // 15% to 40%
        case .analyzing(_, let progress):
            return 0.40 + (progress * 0.55)  // 40% to 95% during analysis
        case .completed:
            return 1.0
        case .failed:
            return 0.0
        }
    }
}
