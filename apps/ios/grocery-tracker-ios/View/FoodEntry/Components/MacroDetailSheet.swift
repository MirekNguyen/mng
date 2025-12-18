import Charts
import SwiftUI

// MARK: - Enums
enum MacroType: String, Identifiable {
    case protein = "Protein"
    case carbs = "Carbs"
    case fat = "Fat"

    var id: String { rawValue }

    var color: Color {
        switch self {
        case .protein: return .blue
        case .carbs: return .green
        case .fat: return .red
        }
    }

    var icon: String {
        switch self {
        case .protein: return "flame.fill"
        case .carbs: return "leaf.fill"
        case .fat: return "drop.fill"
        }
    }

    var description: String {
        switch self {
        case .protein: return "Essential for muscle growth and repair"
        case .carbs: return "Primary energy source for your body"
        case .fat: return "Important for hormone production and nutrient absorption"
        }
    }
}

// MARK: - Main View
struct MacroDetailSheet: View {
    let macroType: MacroType
    let entries: [FoodEntry]
    @Environment(\.dismiss) var dismiss

    // MARK: - Computed Properties
    var totalAmount: Double {
        entries.reduce(0) { result, entry in
            switch macroType {
            case .protein: return result + entry.protein
            case .carbs: return result + entry.carbs
            case .fat: return result + entry.fat
            }
        }
    }

    var macroByMealType: [(mealType: String, amount: Double)] {
        let grouped = Dictionary(grouping: entries) { $0.mealType }
        return grouped.map { (mealType: $0.key.capitalized, amount: getMacroAmount(for: $0.value)) }
            .sorted { $0.amount > $1.amount }
    }

    var topFoods: [(name: String, amount: Double)] {
        entries.map { entry in
            (name: entry.foodName, amount: getMacroAmount(for: entry))
        }
        .sorted { $0.amount > $1.amount }
        .prefix(5)
        .map { $0 }
    }

    // MARK: - Helpers
    func getMacroAmount(for entries: [FoodEntry]) -> Double {
        entries.reduce(0) { result, entry in
            result + getMacroAmount(for: entry)
        }
    }

    func getMacroAmount(for entry: FoodEntry) -> Double {
        switch macroType {
        case .protein: return entry.protein
        case .carbs: return entry.carbs
        case .fat: return entry.fat
        }
    }

    // MARK: - Body
    var body: some View {
        NavigationStack {
            ZStack {
                backgroundView
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        heroSection
                        mealTypeBreakdown
                        topFoodsSection
                        statsSection
                        Color.clear.frame(height: 20)
                    }
                    .padding(.vertical, 20)
                }
            }
            .navigationTitle(macroType.rawValue)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(.white.opacity(0.8))
                            .symbolRenderingMode(.hierarchical)
                    }
                }
            }
        }
    }
    
    // MARK: - Subviews
    private var backgroundView: some View {
        Image("Wallpaper")
            .resizable()
            .aspectRatio(contentMode: .fill)
            .edgesIgnoringSafeArea(.all)
            .background(Color.black)
    }
    
    private var heroSection: some View {
        VStack(spacing: 16) {
            Image(systemName: macroType.icon)
                .font(.system(size: 56))
                .foregroundStyle(macroType.color.gradient)

            VStack(spacing: 8) {
                Text(macroType.rawValue)
                    .font(.title.weight(.bold))
                    .foregroundColor(.primary)

                Text(String(format: "%.1fg", totalAmount))
                    .font(.system(size: 48, weight: .heavy))
                    .foregroundStyle(macroType.color.gradient)

                Text(macroType.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(macroType.color.opacity(0.3), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }
    
    @ViewBuilder
    private var mealTypeBreakdown: some View {
        if !macroByMealType.isEmpty {
            VStack(alignment: .leading, spacing: 16) {
                Text("By Meal Type")
                    .font(.headline)
                    .foregroundColor(.primary)
                    .padding(.horizontal, 20)
                    .padding(.top, 20)

                Text("By Meal Type")
                    .font(.headline)
                    .foregroundColor(.primary)
                    .padding(.horizontal, 20)
                    .padding(.top, 20)

                Chart(macroByMealType, id: \.mealType) { item in
                    BarMark(
                        x: .value("Amount", item.amount),
                        y: .value("Meal", item.mealType)
                    )
                    .foregroundStyle(macroType.color.gradient)
                    .cornerRadius(8)
                    .annotation(position: .trailing, spacing: 8) {
                        Text(String(format: "%.1fg", item.amount))
                            .font(.caption.weight(.semibold))
                            .foregroundColor(.primary)
                    }
                }
                .frame(height: CGFloat(macroByMealType.count) * 50)
                .chartXAxis(.hidden)
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in
                        AxisValueLabel()
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.secondary)
                    }
                }
                .chartXScale(
                    domain: 0...(macroByMealType.map(\.amount).max() ?? 0) * 1.25
                )
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
            )
            .padding(.horizontal, 20)
        }
    }
    
    @ViewBuilder
    private var topFoodsSection: some View {
        if !topFoods.isEmpty {
            VStack(alignment: .leading, spacing: 16) {
                Text("Top Foods")
                    .font(.headline)
                    .foregroundColor(.primary)
                    .padding(.horizontal, 20)
                    .padding(.top, 20)

                VStack(spacing: 12) {
                    ForEach(Array(topFoods.enumerated()), id: \.offset) { index, food in
                        foodRow(index: index, food: food)
                        
                        if index < topFoods.count - 1 {
                            Divider()
                                .padding(.leading, 72)
                                .padding(.trailing, 20)
                        }
                    }
                }
                .padding(.bottom, 20)
            }
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
            )
            .padding(.horizontal, 20)
        }
    }
    
    private func foodRow(index: Int, food: (name: String, amount: Double)) -> some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(macroType.color.opacity(0.2))
                    .frame(width: 36, height: 36)

                Text("\(index + 1)")
                    .font(.headline)
                    .foregroundColor(macroType.color)
            }

            Text(food.name)
                .font(.subheadline)
                .foregroundColor(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(String(format: "%.1fg", food.amount))
                .font(.subheadline.weight(.semibold))
                .foregroundColor(macroType.color)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 4)
    }
    
    private var statsSection: some View {
        HStack(spacing: 16) {
            VStack(spacing: 8) {
                Text("\(entries.count)")
                    .font(.title2.weight(.bold))
                    .foregroundColor(.primary)
                Text("Entries")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
            )

            if entries.count > 0 {
                VStack(spacing: 8) {
                    Text(String(format: "%.1fg", totalAmount / Double(entries.count)))
                        .font(.title2.weight(.bold))
                        .foregroundColor(.primary)
                    Text("Per Entry")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                )
            }
        }
        .padding(.horizontal, 20)
    }
}
