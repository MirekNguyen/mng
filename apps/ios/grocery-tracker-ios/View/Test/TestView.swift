import SwiftUI

struct FoodSummaryCard: View {
    let name: String
    let amount: Double
    let color: Color
    let unit: String

    var body: some View {
        VStack {
            Text(name)
                .font(.footnote)
                .foregroundColor(color)
                .bold()
            Text("\(Int(amount)) \(unit)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, minHeight: 66)
        .padding(.vertical, 8)
        .background(color.opacity(0.10))
        .clipShape(RoundedRectangle(cornerRadius: 13))
    }
}

struct TestView: View {
    @EnvironmentObject var foodEntryRepository: FoodEntryRepository
    @State private var selectedDate: Date = Date()

    var entries: [FoodEntry] { foodEntryRepository.foodEntries ?? [] }
    var totalCalories: Double { entries.reduce(0) { $0 + $1.calories } }
    var totalProtein: Double { entries.reduce(0) { $0 + $1.protein } }
    var totalCarbs: Double { entries.reduce(0) { $0 + $1.carbs } }
    var totalFat: Double { entries.reduce(0) { $0 + $1.fat } }

    var dateText: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.locale = Locale(identifier: "en_GB") // format: 27.10.2025
        return formatter.string(from: selectedDate)
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        Spacer()
                        // Date display in "card" style
                        Text(dateText)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color(.systemGray6))
                            .clipShape(Capsule())
                    }
                    .padding(.top, 6)

                    HStack {
                        Spacer()
                        DatePicker("", selection: $selectedDate, displayedComponents: .date)
                            .labelsHidden()
                            .onChange(of: selectedDate) {
                                Task { await foodEntryRepository.getEntries(date: selectedDate) }
                            }
                        Spacer()
                    }
                    // Calories Card
                    VStack(alignment: .center, spacing: 4) {
                        Text("Total Calories")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Text("\(Int(totalCalories))")
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundColor(.orange)
                        Text("kcal")
                            .foregroundColor(.orange)
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(Color.orange.opacity(0.13))
                    )

                    // Macro Cards
                    Text("Macronutrients")
                        .font(.headline)
                    HStack(spacing: 12) {
                        FoodSummaryCard(name: "Protein", amount: totalProtein, color: .blue, unit: "g")
                        FoodSummaryCard(name: "Carbs", amount: totalCarbs, color: .green, unit: "g")
                        FoodSummaryCard(name: "Fat", amount: totalFat, color: .red, unit: "g")
                    }

                    Text("Entries")
                        .font(.headline)
                    VStack(spacing: 8) {
                        if entries.isEmpty {
                            Text("No entries for this day.")
                                .foregroundColor(.secondary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 20)
                        } else {
                            ForEach(entries, id: \.id) { entry in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(entry.foodName)
                                            .font(.headline)
                                        Text(entry.mealType.capitalized)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        HStack(spacing: 10) {
                                            Text("P \(Int(entry.protein))g").foregroundColor(.blue)
                                            Text("C \(Int(entry.carbs))g").foregroundColor(.green)
                                            Text("F \(Int(entry.fat))g").foregroundColor(.red)
                                        }
                                        .font(.caption2)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing) {
                                        Text("\(Int(entry.calories)) cal")
                                            .font(.headline)
                                            .foregroundColor(.orange)
                                    }
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground).opacity(0.95))
                                .cornerRadius(10)
                            }
                        }
                    }
                }
                .padding([.horizontal, .bottom])
                .navigationTitle("Food Entries")
            }
        }
        .task {
            await foodEntryRepository.getEntries(date: selectedDate)
        }
    }
}
