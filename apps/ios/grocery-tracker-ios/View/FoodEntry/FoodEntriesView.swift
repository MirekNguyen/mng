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
        VStack {
            CalorieGaugeView(currentCalories: totalCalories, targetCalories: 2000)
            HStack(spacing: 12) {
                FoodSummaryCard(name: "Protein", amount: totalProtein, color: .blue, unit: "g")
                FoodSummaryCard(name: "Carbs", amount: totalCarbs, color: .green, unit: "g")
                FoodSummaryCard(name: "Fat", amount: totalFat, color: .red, unit: "g")
            }
            List {
                ForEach(entries, id: \.id) { foodEntry in
                    FoodItemRow(
                        weight: "\(Int(foodEntry.amount ?? 0)) g",
                        foodName: foodEntry.foodName,
                        protein: "\(foodEntry.protein)g protein",
                        calories: "\(foodEntry.calories) kcal"
                    )
                    .padding(.vertical, 8)
                    .listRowInsets(EdgeInsets())
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
            .scrollContentBackground(.hidden)
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                DatePicker(selection: $selectedDate, displayedComponents: .date) {}
                    .onChange(of: selectedDate) {
                        Task { await foodEntryRepository.getEntries(date: selectedDate) }
                    }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddSheet = true
                }) { Image(systemName: "plus.circle.fill") }
            }
        }
        .sheet(
            isPresented: $showAddSheet,
            onDismiss: {
                Task { await foodEntryRepository.getEntries(date: selectedDate) }
            }
        ) {
            FoodEntryForm(selectedDate: $selectedDate)
        }
        .task {
            await foodEntryRepository.getEntries(date: selectedDate)
        }
    }
}
