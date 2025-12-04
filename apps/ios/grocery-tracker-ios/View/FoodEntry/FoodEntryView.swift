import SwiftUI

struct FoodEntryView: View {
    @EnvironmentObject var foodEntryRepository: FoodEntryRepository
    @Environment(\.scenePhase) var scenePhase: ScenePhase
    @State var selectedDate = Date()
    @State private var showAddSheet = false
    @State private var showPhotosSheet = false

    var entries: [FoodEntry] { foodEntryRepository.foodEntries ?? [] }
    var totalCalories: Double { entries.reduce(0) { $0 + $1.calories } }
    var totalProtein: Double { entries.reduce(0) { $0 + $1.protein } }
    var totalCarbs: Double { entries.reduce(0) { $0 + $1.carbs } }
    var totalFat: Double { entries.reduce(0) { $0 + $1.fat } }

    func loadData() async {
        await foodEntryRepository.getEntries(date: selectedDate)
    }

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
                HStack(spacing: 36) {
                    ActionButton(text: "Add entry", icon: "plus", action: { showAddSheet = true })
                    ActionButton(
                        text: "Analyze", icon: "camera.fill", action: { showPhotosSheet = true })
                }
                FoodEntryList(entries: entries)
            }
        }
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Welcome, Mirek!")
                    .font(.headline)
                    .fontWeight(.semibold)
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Profile", systemImage: "person.fill", action: {})
            }
        }
        .fullScreenCover(
            isPresented: $showAddSheet,
            onDismiss: { Task { await loadData() } },
            content: {
                FoodEntryForm(selectedDate: $selectedDate)
                    .presentationBackground(.clear)
            }

        )
        .fullScreenCover(
            isPresented: $showPhotosSheet,
            onDismiss: { Task { await loadData() } },
            content: {
                ImageUploadView()
                    .scrollContentBackground(.hidden)
                    .background(.ultraThinMaterial)
                    .presentationBackground(.clear)
            }
        )
        .task { await loadData() }
        .refreshable { await loadData() }
        .onChange(of: selectedDate) {
            Task { await loadData() }
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                if !Calendar.current.isDateInToday(selectedDate) {
                    selectedDate = Date()
                }
            }
        }
    }
}
