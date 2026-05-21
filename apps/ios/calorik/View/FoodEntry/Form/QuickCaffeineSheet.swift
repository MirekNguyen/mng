import SwiftUI

struct CaffeineDrink: Identifiable {
    let id = UUID()
    let name: String
    let caffeine: Double // mg
    let calories: Double
    let icon: String
    let amount: Double
    let unit: String
}

private let presets: [CaffeineDrink] = [
    CaffeineDrink(name: "Espresso", caffeine: 63, calories: 2, icon: "cup.and.saucer.fill", amount: 30, unit: "ml"),
    CaffeineDrink(name: "Filter Coffee", caffeine: 95, calories: 2, icon: "mug.fill", amount: 240, unit: "ml"),
    CaffeineDrink(name: "Double Espresso", caffeine: 126, calories: 4, icon: "cup.and.saucer.fill", amount: 60, unit: "ml"),
    CaffeineDrink(name: "Coca-Cola Zero", caffeine: 34, calories: 0, icon: "waterbottle.fill", amount: 330, unit: "ml"),
    CaffeineDrink(name: "Coca-Cola", caffeine: 34, calories: 139, icon: "waterbottle.fill", amount: 330, unit: "ml"),
    CaffeineDrink(name: "Green Tea", caffeine: 28, calories: 2, icon: "leaf.fill", amount: 240, unit: "ml"),
    CaffeineDrink(name: "Black Tea", caffeine: 47, calories: 2, icon: "leaf.fill", amount: 240, unit: "ml"),
    CaffeineDrink(name: "Energy Drink", caffeine: 80, calories: 110, icon: "bolt.fill", amount: 250, unit: "ml"),
    CaffeineDrink(name: "Matcha Latte", caffeine: 70, calories: 120, icon: "leaf.fill", amount: 350, unit: "ml"),
]

struct QuickCaffeineSheet: View {
    @EnvironmentObject var foodEntryRepository: FoodEntryRepository
    @Environment(\.dismiss) private var dismiss

    let selectedDate: Date
    let onLogged: () -> Void

    @State private var loggedDrink: CaffeineDrink?

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ForEach(presets) { drink in
                        Button {
                            logDrink(drink)
                        } label: {
                            drinkCard(drink)
                        }
                        .buttonStyle(ScaleButtonStyle())
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
            }
            .navigationTitle("Log Caffeine")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .overlay {
                if loggedDrink != nil {
                    confirmationOverlay
                }
            }
        }
    }

    private func drinkCard(_ drink: CaffeineDrink) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: drink.icon)
                    .font(.system(size: 14))
                    .foregroundStyle(.brown)
                Spacer()
                Text("\(Int(drink.caffeine)) mg")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            Text(drink.name)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.primary)
                .lineLimit(1)

            HStack(spacing: 4) {
                Text("\(Int(drink.amount)) \(drink.unit)")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                if drink.calories > 0 {
                    Text("· \(Int(drink.calories)) kcal")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular.tint(Color.brown.opacity(0.05)).interactive(), in: .rect(cornerRadius: 12))
    }

    private var confirmationOverlay: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 36))
                .foregroundStyle(.green)
            Text("Logged")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.ultraThinMaterial)
        .transition(.opacity)
    }

    private func logDrink(_ drink: CaffeineDrink) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm:ss"

        let entry = CreateFoodEntry(
            userId: nil,
            mealId: nil,
            foodName: drink.name,
            mealType: "snack",
            amount: drink.amount,
            calories: drink.calories,
            protein: 0,
            carbs: 0,
            fat: 0,
            caffeine: drink.caffeine,
            unit: drink.unit,
            entryDate: dateFormatter.string(from: selectedDate),
            entryTime: timeFormatter.string(from: Date()),
            createdAt: nil
        )

        withAnimation(.easeOut(duration: 0.2)) { loggedDrink = drink }

        Task {
            try? await foodEntryRepository.addEntry(entry)
            try? await Task.sleep(nanoseconds: 800_000_000)
            await MainActor.run {
                onLogged()
                dismiss()
            }
        }
    }
}
