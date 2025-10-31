import SwiftUI

struct FoodEntryForm: View {
    @EnvironmentObject var foodRepo: FoodRepository
    @EnvironmentObject var foodEntryRepo: FoodEntryRepository
    @Environment(\.dismiss) private var dismiss

    @State private var selectedFood: Food?
    @State private var amount: Double = 1
    @State private var mealType: String = "breakfast"
    @State private var date = Date()
    @State private var time = Date()
    @State private var isSubmitting = false
    @State private var showConfirmation = false
    @State private var errorMessage: String?
    @State private var showingFoodSearch = false

    let mealTypes = ["breakfast", "lunch", "dinner", "snack", "other"]

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Pick Food")) {
                    Button {
                        showingFoodSearch = true
                    } label: {
                        if let food = selectedFood {
                            Text(food.name).foregroundColor(.primary)
                        } else {
                            Text("Choose a food").foregroundColor(.secondary)
                        }
                    }
                    .sheet(isPresented: $showingFoodSearch) {
                        NavigationView {
                            FoodSearchView(
                                foods: foodRepo.foods ?? [],
                                selectedFood: $selectedFood
                            )
                        }
                    }
                }

                if let food = selectedFood {
                    Section(header: Text("Details")) {
                        HStack {
                            Text("Per \(food.unit ?? "")")
                            Spacer()
                            Text("\(food.calories, specifier: "%.1f") kcal")
                        }
                        Stepper(value: $amount, in: 0.1...100, step: 1) {
                            Text("Amount: \(amount, specifier: "%.1f") \(food.unit ?? "")")
                        }
                        Picker("Meal type", selection: $mealType) {
                            ForEach(mealTypes, id: \.self) { mt in
                                Text(mt.capitalized).tag(mt)
                            }
                        }
                        DatePicker("Date", selection: $date, displayedComponents: .date)
                        DatePicker("Time", selection: $time, displayedComponents: .hourAndMinute)
                    }
                }

                if let error = errorMessage {
                    Text(error).foregroundColor(.red)
                }

                if let food = selectedFood {
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
            .navigationTitle("Add Food Entry")
        }
        .onAppear {
            Task { await foodRepo.fetchFoods() }
        }
    }

    func submit() {
        guard let food = selectedFood else { return }
        isSubmitting = true
        errorMessage = nil

        // Prepare entry date/time as strings:
        let dateString = isoDateString(from: date)
        let timeString = timeString24(from: time)

        // Prepare FoodEntry, using 0 for the id (let server fill it in), calories, protein, etc. are multiplied by the amount.
        let entry = FoodEntry(
            id: nil,
            userId: nil,
            mealId: nil,
            foodName: food.name,
            mealType: mealType,
            amount: amount,
            calories: food.calories * amount,
            protein: food.protein * amount,
            carbs: food.carbs * amount,
            fat: food.fat * amount,
            caffeine: food.caffeine != nil ? food.caffeine! * amount : nil,
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
