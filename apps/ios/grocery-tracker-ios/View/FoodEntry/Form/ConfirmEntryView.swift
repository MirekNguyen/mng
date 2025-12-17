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
                Section {
                    TextField("Food name", text: $entryData.name)
                        .font(.body)
                    
                    NutritionRow(label: "Amount", value: $entryData.amount, unit: entryData.unit)
                        .keyboardType(.decimalPad)
                } header: {
                    Text("Food Details")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.secondary)
                        .textCase(nil)
                }
                
                Section {
                    NutritionRow(label: "Calories", value: $entryData.calories, unit: "kcal", icon: "flame.fill")
                    NutritionRow(label: "Protein", value: $entryData.protein, unit: "g", icon: "scalemass.fill")
                    NutritionRow(label: "Carbs", value: $entryData.carbs, unit: "g", icon: "leaf.fill")
                    NutritionRow(label: "Fats", value: $entryData.fats, unit: "g", icon: "drop.fill")
                } header: {
                    Text("Nutrition")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.secondary)
                        .textCase(nil)
                }
            }
            .scrollContentBackground(.hidden)
            .background(.ultraThinMaterial)
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("Confirm Entry")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                            .symbolRenderingMode(.hierarchical)
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(action: { saveEntry() }) {
                        Image(systemName: "checkmark")
                            .font(.title2)
                            .foregroundStyle(.blue)
                            .symbolRenderingMode(.hierarchical)
                    }
                }
            }
        }
        .presentationBackground(.clear)
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
                    // Clear the pending entry first to dismiss ConfirmEntryView
                    repository.pendingEntry = nil
                    dismiss()
                    // Then dismiss the parent ImageUploadView
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
    var icon: String? = nil

    var body: some View {
        HStack {
            if let icon = icon {
                Label(label, systemImage: icon)
                    .foregroundColor(.primary)
            } else {
                Text(label)
                    .foregroundColor(.primary)
            }
            Spacer()
            TextField("0", value: $value, format: .number.precision(.fractionLength(0...2)))
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 80)
            Text(unit)
                .foregroundColor(.secondary)
        }
    }
}
