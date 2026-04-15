import SwiftUI

/// A compact stats summary card for the profile screen.
/// Shows a 4-stat grid drawn from the last 30 days of tracking data.
/// All stats are read-only.
struct ProfileStatsSection: View {
    @ObservedObject var statsRepository: StatsRepository

    // MARK: - Body

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section header
            VStack(alignment: .leading, spacing: 4) {
                Text("Activity Stats")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)

                Text("Last 30 days")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.white.opacity(0.45))
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
            .padding(.bottom, 20)

            content
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
        }
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
        .task {
            if statsRepository.stats == nil && !statsRepository.isLoading {
                let end = Date()
                let start = Calendar.current.date(byAdding: .day, value: -30, to: end) ?? end
                await statsRepository.fetchStats(startDate: start, endDate: end)
            }
        }
    }

    // MARK: - States

    @ViewBuilder
    private var content: some View {
        if statsRepository.isLoading {
            loadingState
        } else if let stats = statsRepository.stats {
            if stats.entryCount == 0 {
                emptyState
            } else {
                statsGrid(stats: stats)
            }
        } else {
            emptyState
        }
    }

    // MARK: - Stats Grid

    private func statsGrid(stats: Stats) -> some View {
        let topMeal = stats.mealTypeBreakdown
            .max(by: { $0.entryCount < $1.entryCount })
            .map { $0.mealType.replacingOccurrences(of: "_", with: " ").capitalized }
            ?? "—"

        return LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible())],
            spacing: 12
        ) {
            profileStatTile(
                value: "\(stats.entryCount)",
                label: "Entries Logged",
                icon: "fork.knife",
                color: .orange
            )
            profileStatTile(
                value: "\(Int(stats.averageCalories))",
                label: "Avg Daily kcal",
                icon: "flame.fill",
                color: Color(red: 1.0, green: 0.5, blue: 0.2)
            )
            profileStatTile(
                value: String(format: "%.0fg", stats.averageProtein),
                label: "Avg Protein",
                icon: "bolt.fill",
                color: .blue
            )
            profileStatTile(
                value: topMeal,
                label: "Top Meal",
                icon: "star.fill",
                color: Color(red: 0.9, green: 0.75, blue: 0.2)
            )
        }
    }

    private func profileStatTile(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(color)

            VStack(alignment: .leading, spacing: 3) {
                Text(value)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)

                Text(label)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white.opacity(0.55))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.white.opacity(0.07))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(.white.opacity(0.1), lineWidth: 1)
                )
        )
    }

    // MARK: - Loading State

    private var loadingState: some View {
        LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible())],
            spacing: 12
        ) {
            ForEach(0..<4, id: \.self) { _ in
                RoundedRectangle(cornerRadius: 16)
                    .fill(.white.opacity(0.07))
                    .frame(height: 88)
                    .overlay(
                        ProgressView()
                            .tint(.white.opacity(0.4))
                    )
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        HStack(spacing: 14) {
            Image(systemName: "chart.bar.xaxis")
                .font(.system(size: 28))
                .foregroundColor(.white.opacity(0.3))

            VStack(alignment: .leading, spacing: 4) {
                Text("No activity yet")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white.opacity(0.6))

                Text("Start logging meals to see your stats here")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white.opacity(0.35))
            }

            Spacer()
        }
        .padding(.vertical, 8)
    }
}
