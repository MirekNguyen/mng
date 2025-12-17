import SwiftUI

struct FoodSearchView: View {
    var foods: [Food]
    @Binding var selectedFood: Food?
    @State private var searchText = ""
    
    var filteredFoods: [Food] {
        if searchText.isEmpty {
            return foods.sorted { $0.name < $1.name }
        }
        
        // Improved search: search in name and prioritize starts-with matches
        let query = searchText.lowercased()
        let matches = foods.filter { food in
            food.name.lowercased().contains(query)
        }
        
        return matches.sorted { food1, food2 in
            let name1 = food1.name.lowercased()
            let name2 = food2.name.lowercased()
            
            // Prioritize exact matches
            if name1 == query { return true }
            if name2 == query { return false }
            
            // Then prioritize starts-with
            let starts1 = name1.hasPrefix(query)
            let starts2 = name2.hasPrefix(query)
            if starts1 && !starts2 { return true }
            if starts2 && !starts1 { return false }
            
            // Finally sort alphabetically
            return name1 < name2
        }
    }
    
    var suggestedFoods: [Food] {
        Array(foods.sorted { $0.name < $1.name }.prefix(6))
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                if searchText.isEmpty {
                    // Suggested section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Popular Foods")
                            .font(.title3.bold())
                            .foregroundColor(.primary)
                            .padding(.horizontal, 16)
                            .padding(.top, 16)
                        
                        ForEach(suggestedFoods) { food in
                            FoodRowView(food: food, searchQuery: searchText) {
                                selectedFood = food
                            }
                        }
                    }
                } else {
                    // Search results
                    VStack(alignment: .leading, spacing: 0) {
                        if filteredFoods.isEmpty {
                            ContentUnavailableView(
                                "No Results",
                                systemImage: "magnifyingglass",
                                description: Text("Try a different search term")
                            )
                            .padding(.top, 60)
                        } else {
                            Text("\(filteredFoods.count) result\(filteredFoods.count == 1 ? "" : "s")")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 12)
                            
                            ForEach(filteredFoods) { food in
                                FoodRowView(food: food, searchQuery: searchText) {
                                    selectedFood = food
                                }
                            }
                        }
                    }
                }
            }
        }
        .searchable(text: $searchText, prompt: "Search foods")
    }
}

struct FoodRowView: View {
    let food: Food
    let searchQuery: String
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.accentColor.opacity(0.15))
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: "fork.knife")
                        .font(.system(size: 18))
                        .foregroundColor(.accentColor)
                }
                
                // Food name
                VStack(alignment: .leading, spacing: 2) {
                    Text(food.name)
                        .font(.body)
                        .foregroundColor(.primary)
                    
                    if let nutrition = formatNutrition(food) {
                        Text(nutrition)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(.systemBackground).opacity(0.01))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
    
    private func formatNutrition(_ food: Food) -> String? {
        let parts = [
            "\(Int(food.calories)) cal",
            food.protein > 0 ? "\(Int(food.protein))g protein" : nil,
            food.carbs > 0 ? "\(Int(food.carbs))g carbs" : nil
        ].compactMap { $0 }
        
        return parts.isEmpty ? nil : parts.joined(separator: " • ")
    }
}
