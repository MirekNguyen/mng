import SwiftUI

struct ConfirmEntryView: View {
    // This holds the data from the repo, allowing us to edit it
    @State private var entryData: AnalyzedFoodData

    @ObservedObject var repository: FoodEntryRepository
    @Environment(\.dismiss) private var dismiss  // To close the sheet
    
    var onSave: () -> Void  // Callback to dismiss parent sheet

    // Initialize with the data from the repository
    init(data: AnalyzedFoodData, repository: FoodEntryRepository, onSave: @escaping () -> Void = {}) {
        self._entryData = State(initialValue: data)
        self.repository = repository
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Analysis Result")) {
                    TextField("Food Name", text: $entryData.name)
                    NutritionRow(label: "Amount", value: $entryData.amount, unit: entryData.unit)
                        .keyboardType(.decimalPad)
                }
                Section(header: Text("Nutrition")) {
                    NutritionRow(label: "Calories", value: $entryData.calories, unit: "kcal")
                    NutritionRow(label: "Protein", value: $entryData.protein, unit: "g")
                    NutritionRow(label: "Carbs", value: $entryData.carbs, unit: "g")
                    NutritionRow(label: "Fats", value: $entryData.fats, unit: "g")
                }
            }
            .navigationTitle("Confirm Entry")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { saveEntry() }
                }
            }
        }
    }

    private func saveEntry() {
        // 1. Convert your 'AnalyzedFoodData' into the 'FoodEntry'
        //    type that your 'addEntry' function expects.
        //    (You'll need to adjust this to match your 'FoodEntry' model)
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: Date())
        formatter.dateFormat = "HH:mm:ss"
        let timeString = formatter.string(from: Date())

        let newFoodEntry = CreateFoodEntry(
            userId: 1,
            mealId: nil,
            foodName: entryData.name,
            mealType: "lunch",
            amount: entryData.amount,
            calories: entryData.calories,
            protein: entryData.protein,
            carbs: entryData.carbs,
            fat: entryData.fats,
            caffeine: nil,
            unit: entryData.unit,
            entryDate: dateString,
            entryTime: timeString,
            createdAt: nil
        )

        // 2. Call the existing 'addEntry' function
        Task {
            do {
                try await repository.addEntry(newFoodEntry)
                // 3. Dismiss the sheet on success
                await MainActor.run {
                    dismiss()
                    // Also dismiss the parent ImageUploadView
                    onSave()
                }
            } catch {
                // You could set an error message here if saving fails
                print("Failed to save entry: \(error)")
            }
        }
    }
}

// A helper view to make the form cleaner
struct NutritionRow: View {
    let label: String
    @Binding var value: Double
    let unit: String

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            TextField(unit, value: $value, format: .number)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 80)  // Give it a defined width
            Text(unit)
        }
    }
}
