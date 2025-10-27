import SwiftUI

struct TestView: View {
    @EnvironmentObject var groceryRepository: ReceiptRepository
    @State var selectedFlavor: String?

    var body: some View {
        VStack {
            // Show progress while loading
            if groceryRepository.receipts == nil && groceryRepository.errorMessage == nil {
                ProgressView("Loading…")
            }
            // Show the list of receipts
            else if let receipts = groceryRepository.receipts {
                List {
                    ForEach(receipts) { receipt in
                        Section(header: Text(receipt.storeName ?? "Unknown Store")) {
                            ForEach(receipt.receiptItem) { item in
                                Text(item.name)
                            }
                        }
                    }
                }
            }
            // Show error if any
            if let error = groceryRepository.errorMessage {
                Text("Error: \(error)")
                    .foregroundColor(.red)
                    .padding()
            }
        }
        .task {
            await groceryRepository.fetchReceipt()
        }
    }
}
