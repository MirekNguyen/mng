import Foundation 

struct ReceiptDraft: Identifiable, Codable {
    var id: Int
    var total: Double
    var date: Date
    var currency: String
    var storeName: String?
    var items: [ReceiptItemDraft] 
init(from receipt: Receipt) {
    self.id = receipt.id
    self.total = receipt.total
    self.date = receipt.date
    self.currency = receipt.currency
    self.storeName = receipt.storeName
    self.items = receipt.receiptItem.map {
        ReceiptItemDraft(
            id: $0.id,
            receiptId: $0.receiptId,
            date: $0.date,
            name: $0.name,
            description: $0.description,
            category: $0.category,
            unit: $0.unit,
            price: $0.price,
            quantity: $0.quantity,
            priceTotal: $0.priceTotal
        )
    }
}

// Encode using backend field name "receiptItem"
enum CodingKeys: String, CodingKey {
    case id, total, date, currency, storeName
    case items = "receiptItem"
}

// Temporary local snapshot -> optimistic UI
func asTemporaryReceipt() -> Receipt {
    let tempItems: [ReceiptItem] = items.enumerated().map { idx, d in
        ReceiptItem(
            id: d.id ?? -(idx + 1),
            receiptId: d.receiptId ?? id,
            date: d.date,
            name: d.name,
            description: d.description,
            category: d.category,
            unit: d.unit,
            price: d.price,
            quantity: d.quantity,
            priceTotal: d.priceTotal
        )
    }
    return Receipt(id: id, total: total, date: date, currency: currency, storeName: storeName, receiptItem: tempItems)
}

} 

struct ReceiptItemDraft: Identifiable, Codable {
    var id: Int?             // nil for new items
    var receiptId: Int?
    var date: Date?
    var name: String
    var description: String?
    var category: ReceiptItemCategory
    var unit: String?
    var price: Double
    var quantity: Double?
    var priceTotal: Double
} 
