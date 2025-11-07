import SwiftUI

enum StatsSortOrder: String, CaseIterable, Identifiable {
    case amount = "By Amount"
    case category = "By Category"
    var id: String { rawValue }
}

struct StatsView: View {
    @EnvironmentObject var networkManager: NetworkManager
    @State private var sortOrder: StatsSortOrder = .amount

    struct CategoryStat: Identifiable {
        let id = UUID()
        let category: ReceiptItemCategory
        let total: Double
    }

    // All items from all receipts
    var allItems: [ReceiptItem] {
        networkManager.receipts.flatMap { $0.receiptItem }
    }

    // Spending per category as [CategoryStat]
    var categoryStats: [CategoryStat] {
        let dict = allItems.reduce(into: [ReceiptItemCategory: Double]()) { res, item in
            res[item.category, default: 0] += item.priceTotal
        }
        return dict.map { CategoryStat(category: $0, total: $1) }
    }

    var sortedStats: [CategoryStat] {
        switch sortOrder {
        case .amount:
            return categoryStats.sorted { $0.total > $1.total }
        case .category:
            return categoryStats.sorted { $0.category.rawValue < $1.category.rawValue }
        }
    }

    var totalSpent: Double {
        allItems.reduce(0) { res, item in
            res + item.priceTotal
        }
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                // Top Card
                HStack {
                    Image(systemName: "creditcard.fill")
                        .font(.title3.bold())
                        .foregroundColor(.green)
                    VStack(alignment: .leading) {
                        Text("Total Spent")
                            .font(.callout)
                            .foregroundColor(.secondary)
                        Text("\(totalSpent, format: .currency(code: "CZK"))")
                            .font(.title.bold())
                            .foregroundColor(.primary)
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.green.opacity(0.1))
                )
                // Sort picker
                Picker("Sort by", selection: $sortOrder) {
                    ForEach(StatsSortOrder.allCases) { order in
                        Text(order.rawValue).tag(order)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 2)
                // Category breakdown
                if sortedStats.isEmpty {
                    Text("No purchases to analyze yet.")
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                } else {
                    VStack(spacing: 16) {
                        ForEach(sortedStats) { stat in
                            CategoryStatsRow(stat: stat,
                                            total: categoryStats.map(\.total).max() ?? 1)
                        }
                    }
                    .padding(.top, 4)
                }
                Spacer()
            }
            .padding()
            .background(Color(.systemGroupedBackground).ignoresSafeArea())
            .navigationTitle("Stats")
        }
    }
}

struct CategoryStatsRow: View {
    let stat: StatsView.CategoryStat
    let total: Double // for bar scale

    var body: some View {
        HStack {
            Text(stat.category.rawValue.capitalized)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .frame(width: 95, alignment: .leading)
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(.systemGray5))
                    .frame(height: 16)
                RoundedRectangle(cornerRadius: 8)
                    .fill(colorForCategory(stat.category))
                    .frame(width: barWidth, height: 16)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 6)
            Text(stat.total, format: .currency(code: "CZK"))
                .fontWeight(.semibold)
                .foregroundColor(.primary)
                .frame(width: 110, alignment: .trailing)
        }
        .padding(.vertical, 3)
    }

    var barWidth: CGFloat {
        guard total > 0 else { return 0 }
        let maxBarWidth: CGFloat = 160
        return CGFloat(stat.total/total) * maxBarWidth
    }

    func colorForCategory(_ category: ReceiptItemCategory) -> Color {
        switch category {
        case .dairy:      return .blue
        case .bakery:     return .yellow
        case .beverage:   return .teal
        case .meat:       return .pink
        case .produce:    return .green
        case .snack:      return .orange
        case .household:  return .purple
        case .other:      return .gray
        }
    }
}
