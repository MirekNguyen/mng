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
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 2)
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

