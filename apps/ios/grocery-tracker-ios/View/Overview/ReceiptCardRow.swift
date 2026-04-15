import SwiftUI

struct ReceiptCardRow: View {
    let receipt: Receipt
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "building.2")
                    .foregroundColor(.accentColor)
                Text(receipt.storeName ?? "Unknown Store")
                    .font(.headline)
                Spacer()
                Text(formattedDate)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            HStack {
                Image(systemName: "basket.fill")
                    .foregroundColor(.secondary)
                Text("\(receipt.receiptItem.count) items")
                    .foregroundColor(.secondary)
                    .font(.subheadline)
                Spacer()
                Image(systemName: "creditcard.fill")
                    .foregroundColor(.green)
                Text(formattedTotal)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
            }
        }
        .padding(Styles.Spacing.m)
        .background(
            RoundedRectangle(cornerRadius: Styles.CornerRadius.card)
                .fill(.ultraThinMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: Styles.CornerRadius.card)
                .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
        )
        .padding(.vertical, 5)
    }

    private var formattedDate: String {
        let df = DateFormatter()
        df.dateStyle = .medium
        df.timeStyle = .none
        return df.string(from: receipt.date)
    }

    private var formattedTotal: String {
        receipt.total.formatted(.currency(code: currencyCode(from: receipt.currency)))
    }

    private func currencyCode(from symbolOrCode: String) -> String {
        let s = symbolOrCode.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if s.contains("kč") || s == "kc" || s == "czk" { return "CZK" }
        return symbolOrCode.uppercased()
    }

}

