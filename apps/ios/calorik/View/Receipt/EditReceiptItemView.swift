import SwiftUI

struct EditReceiptItemView: View {
    @Binding var item: ReceiptItemDraft
    var body: some View {
        Form {
            Section("Basics") {
                TextField("Name", text: $item.name)
                Picker("Category", selection: $item.category) {
                    ForEach(ReceiptItemCategory.allCases, id: \.self) {
                        Text($0.rawValue.capitalized).tag($0)
                    }
                }
                // TextField("Description", text: $item.description)
            }

            Section("Quantity & Unit") {
                TextField("Quantity", value: $item.quantity, format: .number)
                    .keyboardType(.decimalPad)
                // TextField("Unit", text: $item.unit)
            }

            Section("Pricing") {
                TextField("Unit price", value: $item.price, format: .number)
                    .keyboardType(.decimalPad)
                TextField("Line total", value: $item.priceTotal, format: .number)
                    .keyboardType(.decimalPad)
            }

            Section("Meta") {
                // DatePicker(
                //     "Item date",
                //     selection: Binding(unwrapping: $item.date, default: Date()),
                //     displayedComponents: .date
                // )
            }
        }
        .navigationTitle("Edit Item")
    }
}
