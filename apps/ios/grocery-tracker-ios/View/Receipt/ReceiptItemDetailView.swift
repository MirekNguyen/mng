import SwiftUI

struct ReceiptDetailView: View {
    let receipt: Receipt
    @State private var selectedItem: ReceiptItem?
    var body: some View {
        List {
            Section(header: Text("Receipt Info")) {
                keyValueRow("Store", receipt.storeName ?? "-")
                keyValueRow("Date", formatted(date: receipt.date))
                keyValueRow("Total", money(receipt.total, currency: receipt.currency))
            }

            Section(header: Text("Items")) {
                if receipt.receiptItem.isEmpty {
                    Text("No items found").foregroundColor(.secondary)
                } else {
                    ForEach(receipt.receiptItem) { item in
                        Button {
                            selectedItem = item
                        } label: {
                            HStack {
                                Text(item.name).font(.body)
                                Spacer()
                                Text(item.category.rawValue.capitalized)
                                    .foregroundColor(.secondary)
                                Text(money(item.price, currency: receipt.currency))
                                    .foregroundColor(.primary)
                            }
                        }
                    }
                }
            }
        }
        .sheet(item: $selectedItem) { item in
            NavigationStack {
                ReceiptItemDetailView(item: item, currency: receipt.currency)
            }
        }
        .navigationTitle("Receipt Details")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                NavigationLink("Edit") {
                    EditReceiptView(receipt: receipt)
                }
            }
        }
    }

    // MARK: - Helpers

    private func keyValueRow(_ key: String, _ value: String) -> some View {
        HStack {
            Text("\(key):")
            Spacer()
            Text(value)
        }
    }

    private func formatted(date: Date?) -> String {
        guard let date else { return "-" }
        let df = DateFormatter()
        df.dateStyle = .medium
        df.timeStyle = .none
        return df.string(from: date)
    }

    private func currencyCode(from symbolOrCode: String) -> String {
        let s = symbolOrCode.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if s.contains("kč") || s == "kc" { return "CZK" }
        if s == "czk" { return "CZK" }
        return symbolOrCode.uppercased()
    }

    private func money(_ value: Double, currency: String) -> String {
        let code = currencyCode(from: currency)
        return value.formatted(.currency(code: code))
    }

}

struct ReceiptItemDetailView: View {
    let item: ReceiptItem
    let currency: String
    var body: some View {
        Form {
            Section(header: Text("Product")) {
                Text(item.name)
                    .font(.title2)
                if let desc = item.description, !desc.isEmpty {
                    Text(desc)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            Section(header: Text("Category & Unit")) {
                Text("Category: \(item.category.rawValue.capitalized)")
                if let unit = item.unit, !unit.isEmpty {
                    Text("Unit: \(unit)")
                }
                if let qty = item.quantity {
                    Text("Quantity: \(qty, specifier: "%.2f")")
                }
                if let d = item.date {
                    Text("Item date: \(formatDate(d))")
                }
            }

            Section(header: Text("Pricing")) {
                Text("Price: \(money(item.price))")
                Text("Line total: \(money(item.priceTotal))")
            }
        }
        .navigationTitle("Item Detail")
    }

    // MARK: - Helpers

    private func currencyCode(from symbolOrCode: String) -> String {
        let s = symbolOrCode.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if s.contains("kč") || s == "kc" { return "CZK" }
        if s == "czk" { return "CZK" }
        return symbolOrCode.uppercased()
    }

    private func money(_ value: Double) -> String {
        value.formatted(.currency(code: currencyCode(from: currency)))
    }

    private func formatDate(_ date: Date) -> String {
        let df = DateFormatter()
        df.dateStyle = .medium
        df.timeStyle = .none
        return df.string(from: date)
    }

}
