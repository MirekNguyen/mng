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
                Section(header: Text("Selected Food")) {
                    TextField("", text: $editFoodEntry.foodName)
                        .font(.title3)
                        .font(.body.bold())
                        .foregroundColor(Styles.Colors.primaryText)
                        // .placeholder(when: eventName.isEmpty) {
                        //     Text("Event Name")
                        //         .font(.lumaBody.bold())
                        //         .foregroundColor(.lumaTextPlaceholder)
                        // }
                        .frame(height: Styles.Input.inputRowHeight)

                    // HStack {
                    //     Text(foodEntry.foodName)
                    //     Spacer()
                    //         .foregroundColor(.blue)
                    // }
                }
                Section(header: Text("Change Date")) {
                    DatePicker(
                        "Date", selection: $editFoodEntry.entryDate,
                        displayedComponents: .date)
                }
                Section(header: Text("Change Time")) {
                    DatePicker(
                        "Time", selection: $editFoodEntry.entryTime,
                        displayedComponents: .hourAndMinute)
                }
            }
            .scrollContentBackground(.hidden)
            .background(.ultraThinMaterial)
            .presentationBackground(.clear)
        }
        .navigationTitle("Edit entry")
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark.circle.fill")
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
                    Image(systemName: "checkmark.circle.fill")
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
