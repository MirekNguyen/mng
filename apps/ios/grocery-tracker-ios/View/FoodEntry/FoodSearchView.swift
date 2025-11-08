import SwiftUI

struct FoodSearchView: View {
    var foods: [Food]
    @Binding var selectedFood: Food?
    @State private var searchText = ""
    @State private var isPresented = false
    var maxItems = 8

    var filteredFoods: [Food] {
        if searchText.isEmpty {
            return Array(foods.sorted { $0.name < $1.name }.prefix(maxItems))
        }
        return Array(
            foods.filter { $0.name.localizedCaseInsensitiveContains(searchText) }.prefix(maxItems))
    }

    var body: some View {
        List {
            ForEach(filteredFoods) { food in
                Button {
                    selectedFood = food
                } label: {
                    HStack {
                        Text(food.name)
                            .foregroundColor(Color.black)
                        Spacer()
                        if selectedFood?.id == food.id {
                            Image(systemName: "checkmark")
                                .foregroundColor(.blue)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(PlainButtonStyle())
            }

            // Footer message
            if foods.count > maxItems {
                Text("Type to search through \(foods.count) foods")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .listRowSeparator(.hidden)
            }
        }
        .searchable(
            text: $searchText, isPresented: $isPresented, placement: .automatic,
            prompt: "Search foods")
    }
}
