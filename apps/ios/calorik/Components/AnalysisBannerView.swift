import SwiftUI

/// A compact floating banner shown at the bottom of the screen while meal
/// analysis runs in the background. It transitions to a "ready to review"
/// tap-able state when analysis completes.
struct AnalysisBannerView: View {
    let stage: AnalysisStage
    let isAnalyzing: Bool
    let hasPendingResult: Bool
    /// Called when the user taps the banner in the "ready" state.
    let onReviewTap: () -> Void

    var body: some View {
        Group {
            if isAnalyzing {
                analyzingBanner
            } else if hasPendingResult {
                readyBanner
            }
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
        .animation(.spring(response: 0.45, dampingFraction: 0.75), value: isAnalyzing)
        .animation(.spring(response: 0.45, dampingFraction: 0.75), value: hasPendingResult)
    }

    // MARK: - Analysing state

    private var analyzingBanner: some View {
        HStack(spacing: 12) {
            // Spinning indicator
            ProgressView()
                .progressViewStyle(.circular)
                .tint(.white)
                .scaleEffect(0.85)

            VStack(alignment: .leading, spacing: 2) {
                Text("Analyzing meal…")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)

                if case .analyzing(let message, _) = stage {
                    Text(message)
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.75))
                        .lineLimit(1)
                        .transition(.opacity)
                        .id(message)
                } else {
                    Text(stage.message)
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.75))
                        .lineLimit(1)
                }
            }

            Spacer()

            // Compact progress bar
            if case .uploading(let p) = stage {
                ProgressView(value: p, total: 1.0)
                    .progressViewStyle(.linear)
                    .tint(.white)
                    .frame(width: 60)
                    .scaleEffect(x: 1, y: 1.5, anchor: .center)
            } else if case .analyzing(_, let p) = stage {
                ProgressView(value: p, total: 1.0)
                    .progressViewStyle(.linear)
                    .tint(.white)
                    .frame(width: 60)
                    .scaleEffect(x: 1, y: 1.5, anchor: .center)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.purple.opacity(0.92))
                .shadow(color: .black.opacity(0.25), radius: 12, x: 0, y: 4)
        )
        .padding(.horizontal, 16)
    }

    // MARK: - Ready state

    private var readyBanner: some View {
        Button(action: onReviewTap) {
            HStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(.green)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Meal analysis ready!")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white)
                    Text("Tap to review and save")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.75))
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white.opacity(0.6))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .shadow(color: .black.opacity(0.2), radius: 14, x: 0, y: 4)
            )
            .padding(.horizontal, 16)
        }
        .buttonStyle(.plain)
    }
}
