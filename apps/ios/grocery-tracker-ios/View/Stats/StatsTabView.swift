import SwiftUI
import Charts

struct StatsTabView: View {
    @EnvironmentObject var statsRepository: StatsRepository
    @State private var selectedPeriod: TimePeriod = .week
    @State private var selectedDate: String?
    @State private var selectedMacro: String?
    @State private var selectedMealType: String?
    
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
                        selectedDate = nil
                        selectedMacro = nil
                        selectedMealType = nil
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
                                                x: .value("Date", day.date),
                                                y: .value("Calories", day.calories)
                                            )
                                            .foregroundStyle(.orange.gradient)
                                            .cornerRadius(4)
                                            .opacity(selectedDate == nil ? 1.0 : (selectedDate == day.date ? 1.0 : 0.5))
                                            
                                            if let selectedDate, selectedDate == day.date {
                                                RuleMark(x: .value("Date", day.date))
                                                    .foregroundStyle(.orange.opacity(0.5))
                                                    .lineStyle(StrokeStyle(lineWidth: 2))
                                                    .annotation(
                                                        position: .top,
                                                        spacing: 8,
                                                        overflowResolution: .init(x: .fit, y: .disabled)
                                                    ) {
                                                        VStack(alignment: .leading, spacing: 4) {
                                                            Text(formatFullDate(day.date))
                                                                .font(.caption.weight(.semibold))
                                                                .foregroundColor(.primary)
                                                            Text("\(Int(day.calories)) cal")
                                                                .font(.caption2)
                                                                .foregroundColor(.secondary)
                                                        }
                                                        .padding(8)
                                                        .background(
                                                            RoundedRectangle(cornerRadius: 8)
                                                                .fill(.ultraThinMaterial)
                                                                .shadow(radius: 2)
                                                        )
                                                    }
                                            }
                                        }
                                        .frame(height: 240)
                                        .chartXSelection(value: $selectedDate)
                                        .chartXAxis {
                                            AxisMarks(values: .stride(by: selectedPeriod == .week ? 1 : (selectedPeriod == .month ? 3 : 7))) { value in
                                                if let dateString = value.as(String.self) {
                                                    AxisValueLabel {
                                                        Text(formatDate(dateString))
                                                            .font(.caption2)
                                                    }
                                                    AxisGridLine()
                                                }
                                            }
                                        }
                                        .chartYAxis {
                                            AxisMarks(position: .leading)
                                        }
                                        .sensoryFeedback(.selection, trigger: selectedDate)
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
                                    Text("Average Daily Macros")
                                        .font(.title3.weight(.semibold))
                                        .foregroundColor(.primary)
                                    
                                    let macroData = [
                                        (name: "Protein", value: stats.averageProtein, color: Color.blue),
                                        (name: "Carbs", value: stats.averageCarbs, color: Color.green),
                                        (name: "Fat", value: stats.averageFat, color: Color.red)
                                    ]
                                    
                                    VStack(spacing: 20) {
                                        Chart(macroData, id: \.name) { macro in
                                            SectorMark(
                                                angle: .value("Value", macro.value),
                                                innerRadius: .ratio(0.65),
                                                angularInset: 3
                                            )
                                            .foregroundStyle(macro.color.gradient)
                                            .opacity(selectedMacro == nil ? 1.0 : (selectedMacro == macro.name ? 1.0 : 0.3))
                                        }
                                        .frame(height: 180)
                                        .chartAngleSelection(value: $selectedMacro)
                                        .onTapGesture { location in
                                            // Cycle through macros or deselect
                                            if let currentMacro = selectedMacro {
                                                let currentIndex = macroData.firstIndex(where: { $0.name == currentMacro }) ?? 0
                                                let nextIndex = (currentIndex + 1) % macroData.count
                                                selectedMacro = nextIndex == 0 ? nil : macroData[nextIndex].name
                                            } else {
                                                selectedMacro = macroData[0].name
                                            }
                                        }
                                        .chartBackground { proxy in
                                            GeometryReader { geometry in
                                                if let selectedMacro,
                                                   let macro = macroData.first(where: { $0.name == selectedMacro }) {
                                                    let frame = geometry[proxy.plotAreaFrame]
                                                    VStack(spacing: 4) {
                                                        Text(macro.name)
                                                            .font(.headline)
                                                            .foregroundColor(macro.color)
                                                        Text(String(format: "%.1fg", macro.value))
                                                            .font(.title2.weight(.bold))
                                                            .foregroundColor(.primary)
                                                    }
                                                    .position(x: frame.midX, y: frame.midY)
                                                }
                                            }
                                        }
                                        .sensoryFeedback(.selection, trigger: selectedMacro)
                                        
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
                                                .opacity(selectedMacro == nil ? 1.0 : (selectedMacro == macro.name ? 1.0 : 0.5))
                                                .contentShape(Rectangle())
                                                .onTapGesture {
                                                    if selectedMacro == macro.name {
                                                        selectedMacro = nil
                                                    } else {
                                                        selectedMacro = macro.name
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
                                                x: .value("Date", day.date),
                                                y: .value("Protein", day.protein)
                                            )
                                            .foregroundStyle(.blue.gradient)
                                            .lineStyle(StrokeStyle(lineWidth: 3))
                                            .interpolationMethod(.catmullRom)
                                            
                                            AreaMark(
                                                x: .value("Date", day.date),
                                                y: .value("Protein", day.protein)
                                            )
                                            .foregroundStyle(.blue.opacity(0.2).gradient)
                                            .interpolationMethod(.catmullRom)
                                            
                                            if let selectedDate, selectedDate == day.date {
                                                PointMark(
                                                    x: .value("Date", day.date),
                                                    y: .value("Protein", day.protein)
                                                )
                                                .foregroundStyle(.blue)
                                                .symbolSize(100)
                                                
                                                RuleMark(x: .value("Date", day.date))
                                                    .foregroundStyle(.blue.opacity(0.3))
                                                    .lineStyle(StrokeStyle(lineWidth: 2))
                                                    .annotation(
                                                        position: .top,
                                                        spacing: 8,
                                                        overflowResolution: .init(x: .fit, y: .disabled)
                                                    ) {
                                                        VStack(spacing: 4) {
                                                            Text(formatFullDate(day.date))
                                                                .font(.caption.weight(.semibold))
                                                                .foregroundColor(.primary)
                                                            HStack(spacing: 4) {
                                                                Text("Protein:")
                                                                    .font(.caption2)
                                                                    .foregroundColor(.secondary)
                                                                Text(String(format: "%.1fg", day.protein))
                                                                    .font(.caption.weight(.bold))
                                                                    .foregroundColor(.blue)
                                                            }
                                                        }
                                                        .padding(8)
                                                        .background(
                                                            RoundedRectangle(cornerRadius: 8)
                                                                .fill(.ultraThinMaterial)
                                                                .shadow(radius: 2)
                                                        )
                                                    }
                                            }
                                        }
                                        .frame(height: 200)
                                        .chartXSelection(value: $selectedDate)
                                        .chartXAxis {
                                            AxisMarks(values: .stride(by: selectedPeriod == .week ? 1 : (selectedPeriod == .month ? 3 : 7))) { value in
                                                if let dateString = value.as(String.self) {
                                                    AxisValueLabel {
                                                        Text(formatDate(dateString))
                                                            .font(.caption2)
                                                    }
                                                    AxisGridLine()
                                                }
                                            }
                                        }
                                        .chartYAxis {
                                            AxisMarks(position: .leading)
                                        }
                                        .sensoryFeedback(.selection, trigger: selectedDate)
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
                                        Text("Average Calories by Meal")
                                            .font(.title3.weight(.semibold))
                                            .foregroundColor(.primary)
                                        
                                        Chart(stats.mealTypeBreakdown) { mealType in
                                            BarMark(
                                                x: .value("Meal", mealType.mealType),
                                                y: .value("Calories", mealType.averageCalories)
                                            )
                                            .foregroundStyle(.purple.gradient)
                                            .cornerRadius(4)
                                            .opacity(selectedMealType == nil ? 1.0 : (selectedMealType == mealType.mealType ? 1.0 : 0.5))
                                            
                                            if let selectedMealType, selectedMealType == mealType.mealType {
                                                RuleMark(x: .value("Meal", mealType.mealType))
                                                    .foregroundStyle(.purple.opacity(0.3))
                                                    .lineStyle(StrokeStyle(lineWidth: 2))
                                                    .annotation(
                                                        position: .top,
                                                        spacing: 8,
                                                        overflowResolution: .init(x: .fit, y: .disabled)
                                                    ) {
                                                        VStack(spacing: 4) {
                                                            Text(mealType.mealType.capitalized)
                                                                .font(.caption.weight(.semibold))
                                                                .foregroundColor(.primary)
                                                            HStack(spacing: 8) {
                                                                VStack(alignment: .leading, spacing: 2) {
                                                                    Text("Avg Calories")
                                                                        .font(.caption2)
                                                                        .foregroundColor(.secondary)
                                                                    Text(String(format: "%.0f cal", mealType.averageCalories))
                                                                        .font(.caption.weight(.bold))
                                                                        .foregroundColor(.purple)
                                                                }
                                                                VStack(alignment: .leading, spacing: 2) {
                                                                    Text("Percentage")
                                                                        .font(.caption2)
                                                                        .foregroundColor(.secondary)
                                                                    Text(String(format: "%.1f%%", mealType.percentage))
                                                                        .font(.caption.weight(.bold))
                                                                        .foregroundColor(.purple)
                                                                }
                                                            }
                                                        }
                                                        .padding(8)
                                                        .background(
                                                            RoundedRectangle(cornerRadius: 8)
                                                                .fill(.ultraThinMaterial)
                                                                .shadow(radius: 2)
                                                        )
                                                    }
                                            }
                                        }
                                        .frame(height: 200)
                                        .chartXSelection(value: $selectedMealType)
                                        .chartXAxis {
                                            AxisMarks { value in
                                                if let mealType = value.as(String.self) {
                                                    AxisValueLabel {
                                                        Text(mealType.capitalized)
                                                    }
                                                }
                                            }
                                        }
                                        .chartYAxis {
                                            AxisMarks(position: .leading)
                                        }
                                        .sensoryFeedback(.selection, trigger: selectedMealType)
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
    
    private func formatFullDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-M-d"
        if let date = formatter.date(from: dateString) {
            formatter.dateFormat = "MMM d"
            return formatter.string(from: date)
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
            
            Text(String(format: "%.0f cal", mealType.averageCalories))
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }
}
