import SwiftUI

struct CaffeineSummaryRow: View {
    let amount: Double
    var onTap: (() -> Void)?
    private let dailyLimit: Double = 400

    private var ratio: Double { min(amount / dailyLimit, 1.0) }

    private var tintColor: Color {
        if ratio < 0.5 { return .brown.opacity(0.8) }
        if ratio < 0.75 { return .orange }
        return .red
    }

    var body: some View {
        Button(action: { onTap?() }) {
            HStack(spacing: 10) {
                Image(systemName: "cup.and.saucer.fill")
                    .font(.system(size: 13))
                    .foregroundStyle(tintColor)

                Text("\(Int(amount)) mg caffeine")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.primary)

                Spacer()

                Capsule()
                    .fill(Color.secondary.opacity(0.15))
                    .frame(width: 48, height: 4)
                    .overlay(alignment: .leading) {
                        Capsule()
                            .fill(tintColor)
                            .frame(width: 48 * ratio, height: 4)
                    }

                Text("\(Int(ratio * 100))%")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)

                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(tintColor)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .glassEffect(.regular.tint(tintColor.opacity(0.05)).interactive(), in: .rect(cornerRadius: 10))
        }
        .buttonStyle(ScaleButtonStyle())
    }
}
