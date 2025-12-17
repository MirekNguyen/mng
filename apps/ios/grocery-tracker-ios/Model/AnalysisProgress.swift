import Foundation

enum AnalysisStage: Equatable {
    case idle
    case preparing
    case uploading(progress: Double)
    case analyzing
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
            return "Analyzing"
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
            return "Optimizing your images for analysis..."
        case .uploading(let progress):
            return "Uploading images to server... \(Int(progress * 100))%"
        case .analyzing:
            return "Our AI is identifying your food items..."
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
            return 0.2
        case .uploading(let progress):
            return 0.2 + (progress * 0.5)
        case .analyzing:
            return 0.7
        case .completed:
            return 1.0
        case .failed:
            return 0.0
        }
    }
}
