import SwiftUI

struct FoodEntryList: View {
    @EnvironmentObject var foodEntryRepository: FoodEntryRepository
    @State var entryToEdit: FoodEntry?

    let entries: [FoodEntry]

    var body: some View {
        List {
            ForEach(
                entries.sorted {
                    if $0.entryDate == $1.entryDate {
                        $0.entryTime < $1.entryTime
                    } else {
                        $0.entryDate < $1.entryDate
                    }
                }, id: \.self
            ) { foodEntry in
                FoodItemRow(
                    weight: foodEntry.formattedAmount,
                    foodName: foodEntry.foodName,
                    protein: "\(String(format: "%.0f", foodEntry.protein))g protein",
                    calories: "\(String(format: "%.0f", foodEntry.calories)) kcal",
                    time: foodEntry.entryTime
                )
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.clear)
                .listRowSeparator(foodEntry.id == entries.last?.id ? .hidden : .visible)
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    Button(role: .destructive) {
                        Task {
                            await foodEntryRepository.deleteEntry(id: foodEntry.id)
                        }
                    } label: {
                        Label("Delete", systemImage: "trash")
                            .tint(.red)
                    }
                    Button {
                        entryToEdit = foodEntry
                    } label: {
                        Label("Edit", systemImage: "pencil")
                    }
                    .tint(.blue)
                }
            }
        }
        .fullScreenCover(item: $entryToEdit) { entry in
            NavigationStack {
                EditEntryForm(foodEntry: entry)
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
