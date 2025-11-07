import SwiftUI

struct FoodEntriesView: View {
    @EnvironmentObject var foodEntryRepository: FoodEntryRepository
    @State var selectedDate = Date()
    @State private var showAddSheet = false

    var entries: [FoodEntry] { foodEntryRepository.foodEntries ?? [] }
    var totalCalories: Double { entries.reduce(0) { $0 + $1.calories } }
    var totalProtein: Double { entries.reduce(0) { $0 + $1.protein } }
    var totalCarbs: Double { entries.reduce(0) { $0 + $1.carbs } }
    var totalFat: Double { entries.reduce(0) { $0 + $1.fat } }

    var body: some View {
        ScrollView {
            VStack {
                CalorieGaugeView(
                    selectedDate: $selectedDate, currentCalories: totalCalories,
                    targetCalories: 2000)
                HStack(spacing: 12) {
                    FoodSummaryCard(name: "Protein", amount: totalProtein, color: .blue, unit: "g")
                    FoodSummaryCard(name: "Carbs", amount: totalCarbs, color: .green, unit: "g")
                    FoodSummaryCard(name: "Fat", amount: totalFat, color: .red, unit: "g")
                }
                HStack(spacing: 12) {
                    VStack {
                        Button(
                            action: {
                                showAddSheet = true
                            },
                            label: {
                                Image(systemName: "plus")
                                    .font(.title2)
                                    .frame(width: 40, height: 40)
                                    .clipShape(Circle())

                            }
                        )
                        .buttonStyle(.glass)
                        Text("Add entry")
                    }
                }
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
        .sheet(
            isPresented: $showAddSheet,
            onDismiss: {
                Task { await foodEntryRepository.getEntries(date: selectedDate) }
            },
            content: {
                FoodEntryForm(selectedDate: $selectedDate)
            }

        )
        .task {
            await foodEntryRepository.getEntries(date: selectedDate)
        }
        .onChange(of: selectedDate) {
            Task {
                await foodEntryRepository.getEntries(date: selectedDate)
            }
        }
    }
}
