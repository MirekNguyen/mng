import SwiftUI

struct NewReceiptTab: View {
    @EnvironmentObject var networkManager: NetworkManager
    @Binding var selectedTab: Int
    @State private var draft = NewReceiptDraft()
    @State private var isSaving = false
    @State private var editingItemIndex: Int? = nil
    @State private var showError = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "cart.badge.plus")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 50, height: 50)
                        .foregroundColor(.accentColor)
                    Text("Create a new receipt")
                        .font(.title2).bold()
                    Text("Add store info and items, then save. We’ll show it in Overview.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.top, 8)

                // Basics card
                VStack(alignment: .leading, spacing: 12) {
                    Text("Basics")
                        .font(.headline)
                    VStack(spacing: 12) {
                        TextField(
                            "Store name",
                            text: Binding(
                                get: { draft.storeName ?? "" },
                                set: { draft.storeName = $0.isEmpty ? nil : $0 }
                            )
                        )
                        .textFieldStyle(.roundedBorder)

                        DatePicker("Date", selection: $draft.date, displayedComponents: .date)

                        TextField("Currency (e.g. Kč)", text: $draft.currency)
                            .textInputAutocapitalization(.characters)
                            .textFieldStyle(.roundedBorder)

                        HStack(spacing: 12) {
                            TextField("Total", value: $draft.total, format: .number)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            Button {
                                draft.total = draft.items.reduce(0) { $0 + $1.priceTotal }
                            } label: {
                                Label("Recalculate", systemImage: "sum")
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemBackground))
                        .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 3)
                )
                .padding(.horizontal)

                // Items card
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Items")
                            .font(.headline)
                        Spacer()
                        Button {
                            addItem()
                        } label: {
                            Label("Add Item", systemImage: "plus.circle.fill")
                                .font(.subheadline.weight(.semibold))
                        }
                    }

                    if draft.items.isEmpty {
                        HStack(spacing: 10) {
                            Image(systemName: "rectangle.stack.badge.plus")
                                .foregroundStyle(.secondary)
                            Text("No items yet. Tap Add Item.")
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    } else {
                        VStack(spacing: 10) {
                            ForEach(draft.items.indices, id: \.self) { idx in
                                let item = draft.items[idx]
                                Button {
                                    editingItemIndex = idx
                                } label: {
                                    HStack(alignment: .center, spacing: 12) {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(item.name.isEmpty ? "Unnamed item" : item.name)
                                                .font(.body.weight(.medium))
                                                .foregroundColor(.primary)
                                            HStack(spacing: 8) {
                                                CategoryChip(category: item.category)
                                                if let unit = item.unit, !unit.isEmpty {
                                                    Text(unit)
                                                        .padding(.horizontal, 8)
                                                        .padding(.vertical, 3)
                                                        .background(Color(.systemGray6))
                                                        .foregroundColor(.secondary)
                                                        .clipShape(Capsule())
                                                        .font(.caption)
                                                }
                                            }
                                        }
                                        Spacer()
                                        Text(item.priceTotal, format: .number)
                                            .font(.body.weight(.semibold))
                                            .foregroundColor(.primary)
                                    }
                                    .padding(12)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(Color(.systemGray6))
                                    )
                                }
                                .contextMenu {
                                    Button(role: .destructive) {
                                        draft.items.remove(at: idx)
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemBackground))
                        .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 3)
                )
                .padding(.horizontal)

                // Save button
                Button {
                    Task {
                        await save()
                    }
                } label: {
                    HStack {
                        Image(systemName: "tray.and.arrow.down.fill")
                        Text(isSaving ? "Saving..." : "Save Receipt")
                            .bold()
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isSaving ? Color.gray : Color.accentColor)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .shadow(color: Color.accentColor.opacity(0.18), radius: 6, x: 0, y: 2)
                }
                .disabled(isSaving)
                .padding(.horizontal)

                if let error = networkManager.errorMessage, showError {
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.white)
                        ScrollView(.horizontal, showsIndicators: false) {
                            Text(error)
                                .font(.callout.monospaced())
                                .foregroundColor(.white)
                                .textSelection(.enabled)
                        }
                        Spacer()
                        Button {
                            withAnimation { showError = false }
                        } label: {
                            Image(systemName: "xmark")
                                .foregroundColor(.white)
                        }
                    }
                    .padding(12)
                    .background(Color.red.opacity(0.95))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)
                }
            }
            .padding(.vertical, 10)
        }
        .background(
            LinearGradient(
                colors: [Color(.systemGroupedBackground), Color.accentColor.opacity(0.05)],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()
        )
        .sheet(
            item: Binding(
                get: {
                    if let idx = editingItemIndex { return SheetIndex(index: idx) }
                    return nil
                },
                set: { editingItemIndex = $0?.index }
            )
        ) { sheet in
            NavigationStack {
                EditReceiptItemView(item: $draft.items[sheet.index])
                    .navigationTitle("Edit Item")
            }
        }
    }

    // MARK: - Actions

    private func addItem() {
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
    }

    private func save() async {
        guard !isSaving else { return }
        isSaving = true
        defer { isSaving = false }

        let created = await networkManager.createReceipt(draft)
        if created != nil {
            // Reset form and go to Overview
            draft = NewReceiptDraft()
            networkManager.clearError()
            withAnimation { selectedTab = 2 }  // Overview tab
        } else {
            withAnimation { showError = true }
        }
    }

    // MARK: - Helpers

    private struct SheetIndex: Identifiable {
        let id = UUID()
        let index: Int
    }

}

private struct CategoryChip: View {
    let category: ReceiptItemCategory
    var body: some View {
        Text(category.rawValue.capitalized)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .clipShape(Capsule())
            .font(.caption)
    }
    private var color: Color {
        switch category {
        case .dairy: return .blue
        case .bakery: return .yellow
        case .beverage: return .teal
        case .meat: return .pink
        case .produce: return .green
        case .snack: return .orange
        case .household: return .purple
        case .other: return .gray
        }
    }
}
