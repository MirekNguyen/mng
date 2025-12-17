import SwiftUI

struct AnalysisProgressView: View {
    let stage: AnalysisStage
    
    var body: some View {
        VStack(spacing: 20) {
            // Icon with animation
            ZStack {
                Circle()
                    .fill(iconBackgroundColor)
                    .frame(width: 80, height: 80)
                
                Image(systemName: stage.systemImage)
                    .font(.system(size: 36, weight: .medium))
                    .foregroundColor(iconColor)
                    .symbolEffect(.pulse, options: .repeating, value: isAnimated)
            }
            .padding(.top, 8)
            
            // Title
            Text(stage.title)
                .font(.headline)
                .foregroundColor(.primary)
            
            // Progress bar
            if case .failed = stage {
                // Don't show progress bar for failed state
                EmptyView()
            } else {
                ProgressView(value: stage.progress, total: 1.0)
                    .progressViewStyle(LinearProgressViewStyle(tint: progressTint))
                    .frame(width: 240)
                    .scaleEffect(x: 1, y: 2, anchor: .center)
                    .animation(.easeInOut(duration: 0.3), value: stage.progress)
            }
            
            // Message
            Text(stage.message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(maxWidth: 280)
                .padding(.horizontal)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: 8)
        )
        .padding(.horizontal, 32)
    }
    
    private var iconColor: Color {
        switch stage {
        case .idle:
            return .gray
        case .preparing:
            return .blue
        case .uploading:
            return .blue
        case .analyzing:
            return .purple
        case .completed:
            return .green
        case .failed:
            return .red
        }
    }
    
    private var iconBackgroundColor: Color {
        switch stage {
        case .idle:
            return .gray.opacity(0.1)
        case .preparing:
            return .blue.opacity(0.1)
        case .uploading:
            return .blue.opacity(0.1)
        case .analyzing:
            return .purple.opacity(0.1)
        case .completed:
            return .green.opacity(0.1)
        case .failed:
            return .red.opacity(0.1)
        }
    }
    
    private var progressTint: Color {
        switch stage {
        case .preparing, .uploading:
            return .blue
        case .analyzing:
            return .purple
        case .completed:
            return .green
        default:
            return .blue
        }
    }
    
    private var isAnimated: Bool {
        switch stage {
        case .preparing, .uploading, .analyzing:
            return true
        default:
            return false
        }
    }
}

#Preview {
    VStack(spacing: 40) {
        AnalysisProgressView(stage: .preparing)
        AnalysisProgressView(stage: .uploading(progress: 0.5))
        AnalysisProgressView(stage: .analyzing(message: "Identifying food items..."))
        AnalysisProgressView(stage: .completed)
    }
}
