import SwiftUI
import Charts

struct StatsTabView: View {
    @EnvironmentObject var statsRepository: StatsRepository
    @State private var selectedPeriod: TimePeriod = .week
    
    var startDate: Date {
        switch selectedPeriod {
        case .week:
            return Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        case .month:
            return Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date()
        case .threeMonths:
            return Calendar.current.date(byAdding: .month, value: -3, to: Date()) ?? Date()
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Image("Wallpaper")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 0) {
                    // Period Picker
                    Picker("Period", selection: $selectedPeriod) {
                        ForEach(TimePeriod.allCases, id: \.self) { period in
                            Text(period.rawValue).tag(period)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 20)
                    .onChange(of: selectedPeriod) { _, _ in
                        Task {
                            await statsRepository.fetchStats(startDate: startDate, endDate: Date())
                        }
                    }
                    
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 24) {
                            if statsRepository.isLoading {
                                ProgressView()
                                    .scaleEffect(1.2)
                                    .padding(.top, 100)
                            } else if let stats = statsRepository.stats {
                                
                                // Daily Calories Trend Chart
                                if !stats.dailyBreakdown.isEmpty {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("Daily Calories")
                                            .font(.title3.weight(.semibold))
                                            .foregroundColor(.primary)
                                        
                                        Chart(stats.dailyBreakdown) { day in
                                            BarMark(
                                                x: .value("Date", formatDate(day.date)),
                                                y: .value("Calories", day.calories)
                                            )
                                            .foregroundStyle(.orange.gradient)
                                            .cornerRadius(4)
                                        }
                                        .frame(height: 240)
                                        .chartYAxis {
                                            AxisMarks(position: .leading)
                                        }
                                    }
                                    .padding(20)
                                    .background(
                                        RoundedRectangle(cornerRadius: 16)
                                            .fill(.ultraThinMaterial)
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
                                    )
                                }
                                
                                // Macros Breakdown Chart
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Macros Distribution")
                                        .font(.title3.weight(.semibold))
                                        .foregroundColor(.primary)
                                    
                                    let macroData = [
                                        (name: "Protein", value: stats.totalProtein, color: Color.blue),
                                        (name: "Carbs", value: stats.totalCarbs, color: Color.green),
                                        (name: "Fat", value: stats.totalFat, color: Color.red)
                                    ]
                                    
                                    VStack(spacing: 20) {
                                        Chart(macroData, id: \.name) { macro in
                                            SectorMark(
                                                angle: .value("Value", macro.value),
                                                innerRadius: .ratio(0.65),
                                                angularInset: 3
                                            )
                                            .foregroundStyle(macro.color.gradient)
                                        }
                                        .frame(height: 180)
                                        
                                        HStack(spacing: 24) {
                                            ForEach(macroData, id: \.name) { macro in
                                                HStack(spacing: 8) {
                                                    Circle()
                                                        .fill(macro.color)
                                                        .frame(width: 10, height: 10)
                                                    
                                                    VStack(alignment: .leading, spacing: 2) {
                                                        Text(macro.name)
                                                            .font(.subheadline)
                                                            .foregroundColor(.primary)
                                                        Text(String(format: "%.1fg", macro.value))
                                                            .font(.caption)
                                                            .foregroundColor(.secondary)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    .padding(.top, 8)
                                }
                                .padding(20)
                                .background(
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(.ultraThinMaterial)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
                                )
                                
                                // Daily Protein Trend
                                if !stats.dailyBreakdown.isEmpty {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("Daily Protein")
                                            .font(.title3.weight(.semibold))
                                            .foregroundColor(.primary)
                                        
                                        Chart(stats.dailyBreakdown) { day in
                                            LineMark(
                                                x: .value("Date", formatDate(day.date)),
                                                y: .value("Protein", day.protein)
                                            )
                                            .foregroundStyle(.blue.gradient)
                                            .lineStyle(StrokeStyle(lineWidth: 3))
                                            .symbol(Circle().strokeBorder(lineWidth: 2))
                                            
                                            AreaMark(
                                                x: .value("Date", formatDate(day.date)),
                                                y: .value("Protein", day.protein)
                                            )
                                            .foregroundStyle(.blue.opacity(0.2).gradient)
                                        }
                                        .frame(height: 200)
                                        .chartYAxis {
                                            AxisMarks(position: .leading)
                                        }
                                    }
                                    .padding(20)
                                    .background(
                                        RoundedRectangle(cornerRadius: 16)
                                            .fill(.ultraThinMaterial)
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
                                    )
                                }
                                
                                // Meal Distribution
                                if !stats.mealTypeBreakdown.isEmpty {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text("Calories by Meal")
                                            .font(.title3.weight(.semibold))
                                            .foregroundColor(.primary)
                                        
                                        Chart(stats.mealTypeBreakdown) { mealType in
                                            BarMark(
                                                x: .value("Meal", mealType.mealType.capitalized),
                                                y: .value("Calories", mealType.calories)
                                            )
                                            .foregroundStyle(.purple.gradient)
                                            .cornerRadius(4)
                                        }
                                        .frame(height: 200)
                                        .chartYAxis {
                                            AxisMarks(position: .leading)
                                        }
                                    }
                                    .padding(20)
                                    .background(
                                        RoundedRectangle(cornerRadius: 16)
                                            .fill(.ultraThinMaterial)
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
                                    )
                                }
                                
                            } else {
                                VStack(spacing: 16) {
                                    Image(systemName: "chart.xyaxis.line")
                                        .font(.system(size: 60))
                                        .foregroundColor(.secondary)
                                    
                                    Text("No stats available")
                                        .font(.title3.weight(.semibold))
                                        .foregroundColor(.primary)
                                    
                                    Text("Add food entries to see stats")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.top, 100)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 100)
                    }
                }
            }
            .navigationTitle("Stats")
            .navigationBarTitleDisplayMode(.large)
            .task {
                if statsRepository.stats == nil {
                    await statsRepository.fetchStats(startDate: startDate, endDate: Date())
                }
            }
            .refreshable {
                await statsRepository.fetchStats(startDate: startDate, endDate: Date())
            }
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        let components = dateString.split(separator: "-")
        if components.count >= 2 {
            return "\(components[1])/\(components[2])"
        }
        return dateString
    }
}

enum TimePeriod: String, CaseIterable {
    case week = "Week"
    case month = "Month"
    case threeMonths = "3 Months"
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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

struct MealTypeRow: View {
    let mealType: MealTypeStats
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(mealType.mealType.capitalized)
                    .font(.body.weight(.semibold))
                    .foregroundColor(.primary)
                
                Text("\(mealType.entryCount) entries")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(String(format: "%.0f cal", mealType.calories))
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }
}
