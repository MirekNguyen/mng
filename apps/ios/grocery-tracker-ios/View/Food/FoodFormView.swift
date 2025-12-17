import SwiftUI

enum FoodFormMode {
    case create
    case edit(Food)
}

struct FoodFormView: View {
    @EnvironmentObject var foodRepository: FoodRepository
    @Environment(\.dismiss) private var dismiss
    
    let mode: FoodFormMode
    
    @State private var name: String = ""
    @State private var unit: String = ""
    @State private var description: String = ""
    @State private var calories: String = ""
    @State private var protein: String = ""
    @State private var carbs: String = ""
    @State private var fat: String = ""
    @State private var caffeine: String = ""
    @State private var isSaving = false
    
    var isValid: Bool {
        !name.isEmpty &&
        Double(calories) != nil &&
        Double(protein) != nil &&
        Double(carbs) != nil &&
        Double(fat) != nil
    }
    
    init(mode: FoodFormMode) {
        self.mode = mode
        
        if case .edit(let food) = mode {
            _name = State(initialValue: food.name)
            _unit = State(initialValue: food.unit ?? "")
            _description = State(initialValue: food.description ?? "")
            _calories = State(initialValue: String(format: "%.0f", food.calories))
            _protein = State(initialValue: String(format: "%.1f", food.protein))
            _carbs = State(initialValue: String(format: "%.1f", food.carbs))
            _fat = State(initialValue: String(format: "%.1f", food.fat))
            _caffeine = State(initialValue: food.caffeine != nil ? String(format: "%.1f", food.caffeine!) : "")
        }
    }
    
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                // Icon
                ZStack {
                    Circle()
                        .fill(.green)
                        .frame(width: 72, height: 72)
                        .shadow(color: .green.opacity(0.4), radius: 20, x: 0, y: 8)
                    
                    Image(systemName: "fork.knife")
                        .font(.system(size: 28, weight: .medium))
                        .foregroundColor(.white)
                }
                .padding(.top, 20)
                
                // Basic Info Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("Basic Information")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    VStack(spacing: 0) {
                        FormField(label: "Name", text: $name, placeholder: "e.g., Banana")
                        Divider()
                            .padding(.leading, 20)
                        FormField(label: "Unit", text: $unit, placeholder: "e.g., 100g, 1 cup")
                        Divider()
                            .padding(.leading, 20)
                        FormTextEditor(label: "Description", text: $description, placeholder: "Optional description")
                    }
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.ultraThinMaterial)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
                    )
                }
                
                // Nutrition Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("Nutrition")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    VStack(spacing: 0) {
                        FormField(label: "Calories", text: $calories, placeholder: "0", keyboardType: .decimalPad)
                        Divider()
                            .padding(.leading, 20)
                        FormField(label: "Protein (g)", text: $protein, placeholder: "0", keyboardType: .decimalPad)
                        Divider()
                            .padding(.leading, 20)
                        FormField(label: "Carbs (g)", text: $carbs, placeholder: "0", keyboardType: .decimalPad)
                        Divider()
                            .padding(.leading, 20)
                        FormField(label: "Fat (g)", text: $fat, placeholder: "0", keyboardType: .decimalPad)
                        Divider()
                            .padding(.leading, 20)
                        FormField(label: "Caffeine (mg)", text: $caffeine, placeholder: "0 (optional)", keyboardType: .decimalPad)
                    }
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.ultraThinMaterial)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
                    )
                }
                
                // Save Button
                Button(action: saveFood) {
                    if isSaving {
                        ProgressView()
                            .tint(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.accentColor.opacity(0.6))
                            )
                    } else {
                        Text(mode.isCreate ? "Add Food" : "Save Changes")
                            .font(.body.weight(.semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.accentColor)
                            )
                    }
                }
                .disabled(!isValid || isSaving)
                .opacity(isValid && !isSaving ? 1 : 0.6)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
            .padding(.horizontal, 20)
        }
        .scrollContentBackground(.hidden)
        .background(.ultraThinMaterial)
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle(mode.isCreate ? "Add Food" : "Edit Food")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark")
                        .font(.body.weight(.semibold))
                        .foregroundColor(.secondary)
                }
            }
        }
    }
    
    private func saveFood() {
        guard isValid else { return }
        isSaving = true
        
        Task {
            do {
                let caloriesValue = Double(calories) ?? 0
                let proteinValue = Double(protein) ?? 0
                let carbsValue = Double(carbs) ?? 0
                let fatValue = Double(fat) ?? 0
                let caffeineValue = caffeine.isEmpty ? nil : Double(caffeine)
                
                switch mode {
                case .create:
                    let request = CreateFoodRequest(
                        name: name,
                        unit: unit.isEmpty ? nil : unit,
                        description: description.isEmpty ? nil : description,
                        calories: caloriesValue,
                        protein: proteinValue,
                        carbs: carbsValue,
                        fat: fatValue,
                        caffeine: caffeineValue
                    )
                    _ = try await foodRepository.createFood(request: request)
                    
                case .edit(let food):
                    let request = UpdateFoodRequest(
                        name: name,
                        unit: unit.isEmpty ? nil : unit,
                        description: description.isEmpty ? nil : description,
                        calories: caloriesValue,
                        protein: proteinValue,
                        carbs: carbsValue,
                        fat: fatValue,
                        caffeine: caffeineValue
                    )
                    _ = try await foodRepository.updateFood(id: food.id, request: request)
                }
                
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    print("Error saving food: \(error)")
                }
            }
        }
    }
}

extension FoodFormMode {
    var isCreate: Bool {
        if case .create = self {
            return true
        }
        return false
    }
}

struct FormField: View {
    let label: String
    @Binding var text: String
    let placeholder: String
    var keyboardType: UIKeyboardType = .default
    
    var body: some View {
        HStack(spacing: 16) {
            Text(label)
                .font(.body)
                .foregroundColor(.primary)
                .frame(width: 100, alignment: .leading)
            
            TextField(placeholder, text: $text)
                .font(.body)
                .foregroundColor(.primary)
                .keyboardType(keyboardType)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }
}

struct FormTextEditor: View {
    let label: String
    @Binding var text: String
    let placeholder: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.body)
                .foregroundColor(.primary)
            
            TextEditor(text: $text)
                .font(.body)
                .foregroundColor(.primary)
                .frame(minHeight: 80)
                .scrollContentBackground(.hidden)
                .background(Color.clear)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }
}
