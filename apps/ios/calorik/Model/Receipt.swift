import Foundation

struct Receipt: Identifiable, Codable {
    let id: Int
    let total: Double
    let date: Date
    let currency: String
    let storeName: String?
    let receiptItem: [ReceiptItem]
}
