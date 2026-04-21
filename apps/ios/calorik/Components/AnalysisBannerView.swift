import SwiftUI

struct AnalysisBannerView: View {
    let stage: AnalysisStage
    let isAnalyzing: Bool
    let hasPendingResult: Bool
    let onReviewTap: () -> Void

    var body: some View {
        Group {
            if isAnalyzing {
                analyzingBanner
            } else if hasPendingResult {
                readyBanner
            }
        }
        .padding(.horizontal, 4)
    }

    // MARK: - Analysing

    private var analyzingBanner: some View {
        HStack(spacing: 12) {
            ProgressView()
                .progressViewStyle(.circular)
                .tint(.white)
                .scaleEffect(0.85)

            VStack(alignment: .leading, spacing: 2) {
                Text("Analyzing meal…")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)

                if case .analyzing(let message, _) = stage {
                    Text(message)
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.75))
                        .lineLimit(1)
                        .contentTransition(.opacity)
                        .id(message)
                } else {
                    Text(stage.message)
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.75))
                        .lineLimit(1)
                }
            }

            Spacer()

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
        .padding(.vertical, 10)
        .background(.purple.opacity(0.85), in: .capsule)
    }

    // MARK: - Ready

    private var readyBanner: some View {
        Button(action: onReviewTap) {
            HStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.green)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Meal analysis ready!")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                    Text("Tap to review and save")
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.75))
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.6))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.black.opacity(0.85), in: .capsule)
        }
        .buttonStyle(.plain)
    }
}
