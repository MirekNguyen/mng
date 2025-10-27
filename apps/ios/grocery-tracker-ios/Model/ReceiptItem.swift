import Foundation

struct ReceiptItem: Identifiable, Codable {
    let id: Int
    let receiptId: Int
    let date: Date?
    let name: String
    let description: String?
    let category: ReceiptItemCategory
    let unit: String?
    let price: Double
    let quantity: Double?
    let priceTotal: Double
}
