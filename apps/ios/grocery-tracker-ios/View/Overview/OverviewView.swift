import SwiftUI

struct OverviewView: View {
    @EnvironmentObject var networkManager: NetworkManager
    @State private var showErrorAlert = false
    @State private var editingReceipt: Receipt? = nil
    var body: some View {
        VStack(alignment: .leading) {
            if networkManager.receipts.isEmpty {
                Spacer()
                Text("No receipts yet. Upload one to get started.")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                Spacer()
            } else {
                List {
                    ForEach(networkManager.receipts) { receipt in
                        NavigationLink(destination: ReceiptDetailView(receipt: receipt)) {
                            ReceiptCardRow(receipt: receipt)
                        }
                        .listRowSeparator(.hidden)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            // Delete (optimistic)
                            Button(role: .destructive) {
                                Task { await networkManager.deleteReceipt(receipt) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            // Edit
                            Button {
                                editingReceipt = receipt
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            .tint(.blue)
                        }
                    }
                }
                .listStyle(.plain)
                .refreshable {
                    await networkManager.fetchReceipts()
                }
            }
        }
        .background(Color(.systemGroupedBackground).ignoresSafeArea())
        .task {
            if networkManager.receipts.isEmpty {
                await networkManager.fetchReceipts()
            }
        }
        // Present the editor when user taps Edit in swipe actions
        .sheet(item: $editingReceipt) { receipt in
            NavigationStack {
                EditReceiptView(receipt: receipt)
            }
        }
        // Surface errors from delete/edit
        .onChange(of: networkManager.errorMessage) { _, newValue in
            showErrorAlert = (newValue != nil)
        }
        .alert("Error", isPresented: $showErrorAlert, presenting: networkManager.errorMessage) {
            _ in
            Button("OK", role: .cancel) {
                networkManager.clearError()
            }
        } message: { msg in
            Text(msg)
        }
    }

}
