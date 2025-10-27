import SwiftUI

struct EditReceiptView: View {
    let receipt: Receipt
    @EnvironmentObject var networkManager: NetworkManager
    @State private var draft: ReceiptDraft
    @State private var isSaving = false

    init(receipt: Receipt) {
        self.receipt = receipt
        _draft = State(initialValue: ReceiptDraft(from: receipt))
    }

    var body: some View {
        Form {
            Section("Receipt") {
                TextField(
                    "Store name",
                    text: Binding(
                        get: { draft.storeName ?? "" },
                        set: { draft.storeName = $0.isEmpty ? nil : $0 }
                    ))
                DatePicker("Date", selection: $draft.date, displayedComponents: [.date])
                TextField("Currency", text: $draft.currency)
                    .textInputAutocapitalization(.characters)

                HStack {
                    TextField("Total", value: $draft.total, format: .number)
                        .keyboardType(.decimalPad)
                    Spacer()
                    Button("Recalculate") {
                        draft.total = draft.items.reduce(0) { $0 + ($1.priceTotal) }
                    }
                }
            }

            Section("Items") {
                if draft.items.isEmpty {
                    Text("No items").foregroundColor(.secondary)
                }
                // Iterate by indices to avoid Identifiable issues with optional IDs
                ForEach(draft.items.indices, id: \.self) { idx in
                    let item = draft.items[idx]
                    NavigationLink {
                        EditReceiptItemView(item: $draft.items[idx])
                    } label: {
                        HStack {
                            Text(item.name)
                            Spacer()
                            Text(item.priceTotal, format: .number)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .onDelete { indexSet in
                    draft.items.remove(atOffsets: indexSet)
                }

                Button {
                    draft.items.append(
                        ReceiptItemDraft(
                            id: nil,
                            receiptId: draft.id,
                            date: draft.date,
                            name: "New item",
                            description: nil,
                            category: .other,
                            unit: nil,
                            price: 0,
                            quantity: 1,
                            priceTotal: 0
                        )
                    )
                } label: {
                    Label("Add Item", systemImage: "plus.circle")
                }
            }
        }
        .navigationTitle("Edit Receipt")
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                if isSaving {
                    ProgressView()
                } else {
                    Button("Save") {
                        Task {
                            isSaving = true
                            await networkManager.updateReceipt(draft)
                            isSaving = false
                        }
                    }
                }
            }
        }
    }
}
