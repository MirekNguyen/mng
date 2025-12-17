import SwiftUI

struct EditEntryForm: View {
    @EnvironmentObject private var foodEntryRepository: FoodEntryRepository
    @Environment(\.dismiss) private var dismiss: DismissAction

    var foodEntry: FoodEntry
    @State private var editFoodEntry: EditFoodEntry
    @State private var showErrorAlert = false

    init(foodEntry: FoodEntry) {
        self.foodEntry = foodEntry
        _editFoodEntry = State(initialValue: EditFoodEntry(foodEntry: foodEntry))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Food name", text: $editFoodEntry.foodName)
                        .font(.body)
                } header: {
                    Text("Food")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.secondary)
                        .textCase(nil)
                }
                
                Section {
                    DatePicker(
                        "Date", selection: $editFoodEntry.entryDate,
                        displayedComponents: .date)
                    
                    DatePicker(
                        "Time", selection: $editFoodEntry.entryTime,
                        displayedComponents: .hourAndMinute)
                } header: {
                    Text("Date & Time")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.secondary)
                        .textCase(nil)
                }
            }
            .scrollContentBackground(.hidden)
            .background(.ultraThinMaterial)
            .scrollDismissesKeyboard(.interactively)
            .presentationBackground(.clear)
        }
        .navigationTitle("Edit Entry")
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
                Button(action: {
                    editEntry()
                    dismiss()
                }) {
                    Image(systemName: "checkmark")
                        .font(.title2)
                        .foregroundStyle(.blue)
                        .symbolRenderingMode(.hierarchical)
                }
            }
        }
        .alert("Error", isPresented: $showErrorAlert) {
            Button("OK", role: .cancel) {
                foodEntryRepository.errorMessage = nil
            }
        } message: {
            Text(foodEntryRepository.errorMessage ?? "Unknown error")
        }
        .onChange(of: foodEntryRepository.errorMessage) { _, newValue in
            if newValue != nil {
                showErrorAlert = true
            }
        }

    }

    private func editEntry() {
        Task {
            await foodEntryRepository.updateEntry(id: foodEntry.id, entry: editFoodEntry)
        }
    }
}
