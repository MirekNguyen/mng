import SwiftUI

struct FoodListView: View {
    @EnvironmentObject var foodRepository: FoodRepository
    @State private var searchText = ""
    @State private var selectedFood: Food?
    @State private var showingAddFood = false
    @State private var showingEditFood = false
    @State private var foodToEdit: Food?
    
    var filteredFoods: [Food] {
        guard let foods = foodRepository.foods else { return [] }
        
        if searchText.isEmpty {
            return foods.sorted { $0.name < $1.name }
        }
        
        let lowercasedQuery = searchText.lowercased()
        
        // Smart prioritization: exact match > starts with > contains
        let exactMatches = foods.filter { $0.name.lowercased() == lowercasedQuery }
        let startsWithMatches = foods.filter {
            $0.name.lowercased().starts(with: lowercasedQuery) && $0.name.lowercased() != lowercasedQuery
        }
        let containsMatches = foods.filter {
            $0.name.lowercased().contains(lowercasedQuery) && !$0.name.lowercased().starts(with: lowercasedQuery)
        }
        
        return exactMatches + startsWithMatches + containsMatches
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Image("Wallpaper")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .edgesIgnoringSafeArea(.all)
                
                if foodRepository.foods == nil {
                    ProgressView()
                        .scaleEffect(1.2)
                } else if filteredFoods.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "fork.knife.circle")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        
                        Text(searchText.isEmpty ? "No foods yet" : "No results found")
                            .font(.title3.weight(.semibold))
                            .foregroundColor(.primary)
                        
                        if searchText.isEmpty {
                            Text("Add your first food item")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                } else {
                    ScrollView(showsIndicators: false) {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredFoods) { food in
                                FoodRow(food: food)
                                    .onTapGesture {
                                        selectedFood = food
                                    }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 12)
                        .padding(.bottom, 100)
                    }
                    .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search foods")
                }
            }
            .navigationTitle("Foods")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddFood = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundColor(.white)
                    }
                }
            }
            .sheet(item: $selectedFood) { food in
                FoodDetailView(food: food, onEdit: {
                    foodToEdit = food
                    showingEditFood = true
                }, onDelete: {
                    Task {
                        do {
                            try await foodRepository.deleteFood(id: food.id)
                        } catch {
                            print("Error deleting food: \(error)")
                        }
                    }
                })
            }
            .sheet(isPresented: $showingAddFood) {
                NavigationStack {
                    FoodFormView(mode: .create)
                }
            }
            .sheet(isPresented: $showingEditFood) {
                if let food = foodToEdit {
                    NavigationStack {
                        FoodFormView(mode: .edit(food))
                    }
                }
            }
            .task {
                if foodRepository.foods == nil {
                    await foodRepository.fetchFoods()
                }
            }
            .refreshable {
                await foodRepository.fetchFoods()
            }
        }
    }
}

struct FoodRow: View {
    let food: Food
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon
            ZStack {
                Circle()
                    .fill(.green)
                    .frame(width: 54, height: 54)
                    .shadow(color: .green.opacity(0.4), radius: 12, x: 0, y: 4)
                
                Image(systemName: "fork.knife")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(.white)
            }
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(food.name)
                    .font(.body.weight(.semibold))
                    .foregroundColor(.primary)
                
                HStack(spacing: 8) {
                    Label(String(format: "%.0f cal", food.calories), systemImage: "flame.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let unit = food.unit {
                        Text("• \(unit)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
        )
    }
}
