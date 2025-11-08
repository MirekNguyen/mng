import SwiftUI

struct FoodEntryList: View {
    @EnvironmentObject var foodEntryRepository: FoodEntryRepository
    let entries: [FoodEntry]

    var body: some View {
        List {
            ForEach(entries.indices, id: \.self) { index in
                let foodEntry = entries[index]

                FoodItemRow(
                    weight:
                        "\(foodEntry.amount?.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", foodEntry.amount ?? 0) : String(format: "%.1f", foodEntry.amount ?? 0)) \(foodEntry.unit)",
                    foodName: foodEntry.foodName,
                    protein: "\(String(format: "%.0f", foodEntry.protein))g protein",
                    calories: "\(String(format: "%.0f", foodEntry.calories)) kcal"
                )
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.clear)
                .listRowSeparator(index == entries.count - 1 ? .hidden : .visible)
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    Button(role: .destructive) {
                        Task {
                            await foodEntryRepository.deleteEntry(id: foodEntry.id ?? 0)
                        }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
        .scrollDisabled(true)
        .frame(height: CGFloat(entries.count * 85))
        .listStyle(PlainListStyle())
        .glassEffect(.regular, in: .rect(cornerRadius: 16))
        .padding(.horizontal, 10)  // Side padding
        .padding(.vertical, 12)

    }
}
