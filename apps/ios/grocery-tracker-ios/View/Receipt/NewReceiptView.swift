import SwiftUI

struct NewReceiptDraft {
    var total: Double = 0
    var date: Date = Date()
    var currency: String = "Kč"
    var storeName: String? = nil
    var items: [ReceiptItemDraft] = []
}

struct NewReceiptView: View {
    @EnvironmentObject var networkManager: NetworkManager
    @State private var draft = NewReceiptDraft()
    @State private var isSaving = false
    @State private var editingItemIndex: Int? = nil

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
                        draft.total = draft.items.reduce(0) { $0 + $1.priceTotal }
                    }
                }
            }

            Section("Items") {
                if draft.items.isEmpty {
                    Text("No items").foregroundColor(.secondary)
                }
                ForEach(draft.items.indices, id: \.self) { idx in
                    let item = draft.items[idx]
                    Button {
                        editingItemIndex = idx
                    } label: {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(item.name.isEmpty ? "Unnamed item" : item.name)
                                Text(item.category.rawValue.capitalized)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(item.priceTotal, format: .number)
                                .foregroundColor(.secondary)
                        }
                    }
                    .contextMenu {
                        Button("Delete", role: .destructive) {
                            draft.items.remove(at: idx)
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
                            receiptId: nil,
                            date: draft.date,
                            name: "",
                            description: nil,
                            category: .other,
                            unit: nil,
                            price: 0,
                            quantity: 1,
                            priceTotal: 0
                        )
                    )
                    editingItemIndex = draft.items.count - 1
                } label: {
                    Label("Add Item", systemImage: "plus.circle")
                }
            }
        }
        .navigationTitle("New Receipt")
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {}
            }
            ToolbarItem(placement: .confirmationAction) {
                if isSaving {
                    ProgressView()
                } else {
                    Button("Save") {
                        Task {
                            isSaving = true
                            let created = await networkManager.createReceipt(draft)
                            isSaving = false
                            if created != nil {
                            }
                        }
                    }
                    .disabled(!canSave)
                }
            }
        }
        .sheet(
            item: Binding(
                get: {
                    if let idx = editingItemIndex {
                        return SheetIndex(index: idx)
                    } else {
                        return nil
                    }
                },
                set: { newValue in
                    editingItemIndex = newValue?.index
                }
            )
        ) { sheet in
            NavigationStack {
                EditReceiptItemView(item: $draft.items[sheet.index])
            }
        }
    }

    private var canSave: Bool {
        !draft.currency.isEmpty && draft.total >= 0
    }

    private struct SheetIndex: Identifiable {
        let id = UUID()
        let index: Int
    }

}
