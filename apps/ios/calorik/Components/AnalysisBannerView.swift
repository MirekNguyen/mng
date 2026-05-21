import SwiftUI

struct AnalysisBannerView: View {
    @ObservedObject var manager: BackgroundAnalysisManager
    var onReview: () -> Void = {}

    var body: some View {
        Group {
            if manager.isAnalyzing {
                analyzingBanner
            } else if manager.pendingResult != nil {
                readyBanner
            }
        }
        .animation(.easeInOut(duration: 0.3), value: manager.isAnalyzing)
        .animation(.easeInOut(duration: 0.3), value: manager.pendingResult != nil)
    }

    // MARK: - Analyzing

    private var analyzingBanner: some View {
        HStack(spacing: 12) {
            ProgressView()
                .progressViewStyle(.circular)
                .tint(.secondary)
                .scaleEffect(0.8)

            VStack(alignment: .leading, spacing: 2) {
                Text("Analyzing meal")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.primary)

                if case .analyzing(let message, _) = manager.stage {
                    Text(message)
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .contentTransition(.numericText())
                        .id(message)
                } else {
                    Text(manager.stage.message)
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            progressIndicator
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    @ViewBuilder
    private var progressIndicator: some View {
        if case .uploading(let p) = manager.stage {
            CircularProgress(progress: p)
        } else if case .analyzing(_, let p) = manager.stage {
            CircularProgress(progress: p)
        }
    }

    // MARK: - Ready

    private var readyBanner: some View {
        Button(action: onReview) {
            HStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(.green)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Meal analyzed")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.primary)
                    Text("Tap to review")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Circular Progress

private struct CircularProgress: View {
    let progress: Double

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.secondary.opacity(0.2), lineWidth: 2.5)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(Color.primary.opacity(0.6), style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.4), value: progress)
        }
        .frame(width: 22, height: 22)
    }
}
