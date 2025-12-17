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
    @FocusState private var isAmountFieldFocused: Bool

    let mealTypes = ["breakfast", "lunch", "dinner", "snack"]

    var body: some View {
        NavigationView {
            Group {
                if selectedFood == nil {
                    FoodSearchView(
                        foods: foodRepo.foods ?? [],
                        selectedFood: $selectedFood
                    )
                    .scrollContentBackground(.hidden)
                    .background(.ultraThinMaterial)
                    .foregroundColor(Styles.Colors.primaryText)
                } else {
                    // Show form after food is selected
                    foodEntryFormView
                    .scrollContentBackground(.hidden)
                    .background(.ultraThinMaterial)
                }
            }
            .navigationTitle(selectedFood == nil ? "Select Food" : "Add Food Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                            .symbolRenderingMode(.hierarchical)
                    }
                }
            }
        }
        .onAppear {
            mealType = getMealTypeFromTime(Date())
            Task { await foodRepo.fetchFoods() }
        }
        .onChange(of: selectedFood) { _, newValue in
            if newValue != nil {
                // Small delay to ensure the form is rendered before focusing
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    isAmountFieldFocused = true
                }
            }
        }
    }

    private var foodEntryFormView: some View {
        Form {
            Section {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.accentColor.opacity(0.15))
                            .frame(width: 40, height: 40)
                        
                        Image(systemName: "fork.knife")
                            .font(.system(size: 16))
                            .foregroundColor(.accentColor)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(selectedFood?.name ?? "")
                            .font(.body)
                            .foregroundColor(.primary)
                        Text("Selected food")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Button("Change") {
                        selectedFood = nil
                    }
                    .font(.subheadline)
                    .foregroundColor(.accentColor)
                }
                .padding(.vertical, 4)
            } header: {
                Text("Food")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.secondary)
                    .textCase(nil)
            }

            Section {
                HStack {
                    Text("Amount")
                        .foregroundColor(.primary)
                    Spacer()
                    TextField(
                        "0", value: $amount,
                        format: .number.precision(.fractionLength(0...2))
                    )
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .focused($isAmountFieldFocused)
                    .frame(width: 80)

                    Text(selectedFood?.unit ?? "pcs")
                        .foregroundColor(.secondary)
                }

                Picker("Meal Type", selection: $mealType) {
                    ForEach(mealTypes, id: \.self) { mealType in
                        Text(mealType.capitalized).tag(mealType)
                    }
                }
                
                DatePicker("Time", selection: $time, displayedComponents: .hourAndMinute)
            } header: {
                Text("Details")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.secondary)
                    .textCase(nil)
            }

            if let food = selectedFood {
                Section {
                    HStack {
                        Label("Calories", systemImage: "flame.fill")
                            .foregroundColor(.primary)
                        Spacer()
                        Text("\(food.calories * amount, specifier: "%.0f") kcal")
                            .foregroundColor(.secondary)
                    }
                } header: {
                    Text("Nutrition Preview")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.secondary)
                        .textCase(nil)
                }
            }

            if let error = errorMessage {
                Section {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(.red)
                    }
                }
            }

            Section {
                Button(action: submit) {
                    HStack {
                        Spacer()
                        if isSubmitting {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Add Entry")
                                .fontWeight(.semibold)
                        }
                        Spacer()
                    }
                }
                .disabled(isSubmitting)
                .listRowBackground(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.accentColor)
                )
                .foregroundColor(.white)
                .alert("Entry Added", isPresented: $showConfirmation) {
                    Button("OK", role: .cancel) { showConfirmation = false }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(.ultraThinMaterial)
        .scrollDismissesKeyboard(.interactively)
        .onAppear {
            isAmountFieldFocused = true
        }
    }

    private func submit() {
        guard let food = selectedFood else { return }
        isSubmitting = true
        errorMessage = nil

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: selectedDate)
        formatter.dateFormat = "HH:mm:ss"
        let timeString = formatter.string(from: time)

        let entry = CreateFoodEntry(
            userId: 1,
            mealId: food.id,
            foodName: food.name,
            mealType: mealType,  // Use the selected mealType
            amount: amount,
            calories: food.calories * amount,
            protein: food.protein * amount,
            carbs: food.carbs * amount,
            fat: food.fat * amount,
            caffeine: food.caffeine != nil ? food.caffeine! * amount : nil,
            unit: food.unit ?? "pcs",
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

    private func getMealTypeFromTime(_ date: Date) -> String {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: date)

        switch hour {
        case 5..<11:
            return "breakfast"
        case 11..<15:
            return "lunch"
        case 15..<20:
            return "dinner"
        default:
            return "snack"
        }
    }
}
