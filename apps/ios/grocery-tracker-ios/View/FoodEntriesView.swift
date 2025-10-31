import SwiftUI

struct FoodEntriesView: View {
    @EnvironmentObject var foodEntryRepository: FoodEntryRepository
    @State var selectedDate = Date()
    @State private var showAddSheet = false
    var entries: [FoodEntry] { foodEntryRepository.foodEntries ?? [] }
    var totalCalories: Int { Int(entries.reduce(0) { $0 + $1.calories }) }
    var totalProtein: Int { Int(entries.reduce(0) { $0 + $1.protein }) }
    var totalCarbs: Int { Int(entries.reduce(0) { $0 + $1.carbs }) }
    var totalFat: Int { Int(entries.reduce(0) { $0 + $1.fat }) }

    var body: some View {
        NavigationView {
            VStack {
                VStack {
                    Text("Total calories")
                        .font(.subheadline)
                    Text("\(totalCalories)")
                        // .font(.system(size: 40, weight: .bold))
                        .font(.title)
                    Text("kcal")
                        .font(.headline)
                }
                .foregroundColor(.primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    RoundedRectangle(cornerRadius: 18)
                        .fill(Color.orange.opacity(0.13))
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))

                List(foodEntryRepository.foodEntries ?? [], id: \.id) { foodEntry in
                    NavigationLink(destination: TestView()) {
                        HStack {
                            Text(foodEntry.foodName)
                            Text("\(Int(foodEntry.calories))")
                        }
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        // Delete (optimistic)
                        Button(role: .destructive) {
                            Task {
                                await foodEntryRepository.deleteEntry(id: foodEntry.id ?? 0)
                            }
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                        // // Edit
                        // Button {
                        //     editingReceipt = receipt
                        // } label: {
                        //     Label("Edit", systemImage: "pencil")
                        // }
                        // .tint(.blue)
                    }

                }
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
                    }) {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
        }
        .sheet(
            isPresented: $showAddSheet,
            onDismiss: {
                // Refresh entries after adding
                Task { await foodEntryRepository.getEntries(date: selectedDate) }
            }
        ) {
            // Needs both repositories (assuming you inject both in your main/tab view)
            FoodEntryForm()
        }
        .task {
            await foodEntryRepository.getEntries(date: selectedDate)
        }
    }
}
