import SwiftUI

struct FoodEntryForm: View {
    @EnvironmentObject var foodRepo: FoodRepository
    @EnvironmentObject var foodEntryRepo: FoodEntryRepository
    @Environment(\.dismiss) private var dismiss
    @Binding var selectedDate: Date
    @State private var selectedFood: Food?
    @State private var amount: Double = 1
    @State private var mealType: String = "breakfast"
    @State private var time = Date()
    @State private var isSubmitting = false
    @State private var showConfirmation = false
    @State private var errorMessage: String?
    @State private var showingFoodSearch = false

    let mealTypes = ["breakfast", "lunch", "dinner", "snack"]

    var body: some View {
        NavigationView {
            Group {
                if selectedFood == nil {
                    // Show food search first
                    FoodSearchView(
                        foods: foodRepo.foods ?? [],
                        selectedFood: $selectedFood
                    )
                } else {
                    // Show form after food is selected
                    foodEntryFormView
                }
            }
            .navigationTitle(selectedFood == nil ? "Select Food" : "Add Food Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            Task { await foodRepo.fetchFoods() }
        }
    }

    private var foodEntryFormView: some View {
        Form {
            Section(header: Text("Selected Food")) {
                HStack {
                    Text(selectedFood?.name ?? "")
                    Spacer()
                    Button("Change") {
                        selectedFood = nil  // This will go back to food search
                    }
                    .foregroundColor(.blue)
                }
            }

            Section(header: Text("Details")) {
                HStack {
                    Text("Amount:")
                    Spacer()
                    HStack {
                        TextField(
                            "0", value: $amount,
                            format: .number.precision(.fractionLength(0...2))
                        )
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        Text("grams")
                            .foregroundColor(.secondary)
                    }
                }

                Picker("Meal type", selection: $mealType) {
                    ForEach(mealTypes, id: \.self) { mt in
                        Text(mt.capitalized).tag(mt)
                    }
                }
            }

            if let food = selectedFood {
                Section(header: Text("Overview")) {
                    HStack {
                        Text("Calories:")
                        Spacer()
                        Text("\(food.calories * amount, specifier: "%.0f") kcal")
                    }
                }
            }

            if let error = errorMessage {
                Text(error).foregroundColor(.red)
            }

            Section {
                Button(action: submit) {
                    if isSubmitting {
                        ProgressView()
                    } else {
                        Text("Add Entry")
                    }
                }
                .disabled(isSubmitting)
                .alert("Entry Added", isPresented: $showConfirmation) {
                    Button("OK", role: .cancel) { showConfirmation = false }
                }
            }
        }
    }

    func submit() {
        guard let food = selectedFood else { return }
        isSubmitting = true
        errorMessage = nil

        let dateString = isoDateString(from: selectedDate)
        let timeString = timeString24(from: time)

        let entry = FoodEntry(
            id: nil,
            userId: nil,
            mealId: food.id,
            foodName: food.name,
            mealType: mealType,
            amount: amount,
            calories: food.calories * amount,
            protein: food.protein * amount,
            carbs: food.carbs * amount,
            fat: food.fat * amount,
            caffeine: food.caffeine != nil ? food.caffeine! * amount : nil,
            unit: food.unit ?? "serving",
            entryDate: dateString,
            entryTime: timeString,
            createdAt: nil
        )

        Task {
            do {
                try await foodEntryRepo.addEntry(entry)
                await MainActor.run {
                    isSubmitting = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSubmitting = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }

    // Helpers:
    func isoDateString(from date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    func timeString24(from date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return f.string(from: date)
    }
}
