import SwiftUI

struct FoodSearchView: View {
    var foods: [Food]
    @Binding var selectedFood: Food?
    @Environment(\.dismiss) var dismiss

    @State private var searchText = ""
    @State private var isPresented = true

    var filteredFoods: [Food] {
        if searchText.isEmpty {
            return foods
        }
        return foods.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        List(filteredFoods) { food in
            Button {
                selectedFood = food
                dismiss()
            } label: {
                HStack {
                    Text(food.name)
                    Spacer()
                    if selectedFood?.id == food.id {
                        Image(systemName: "checkmark")
                    }
                }
            }
        }
        .searchable(text: $searchText, isPresented: $isPresented, placement: .automatic, prompt: "Search foods")
        .navigationTitle("Select Food")
    }
}
