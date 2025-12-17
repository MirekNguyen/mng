import Charts
import SwiftUI

struct CalorieGaugeView: View {
    @Binding var selectedDate: Date
    @State private var calendarId: Int = 0
    @State private var animatedProgress: Double = 0.0

    let currentCalories: Double
    let targetCalories: Double

    var progress: Double {
        min(currentCalories / targetCalories, 1.0)
    }

    var body: some View {
        ZStack {
            // Background arc
            Chart {
                SectorMark(
                    angle: .value("Background", 1.0),
                    innerRadius: .ratio(0.7),
                    outerRadius: .ratio(0.9),
                    angularInset: 2
                )
                .foregroundStyle(Color.gray.opacity(0.3))

                // Progress arc
                SectorMark(
                    angle: .value("Progress", animatedProgress),
                    innerRadius: .ratio(0.7),
                    outerRadius: .ratio(0.9),
                    angularInset: 2
                )
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color.orange.opacity(0.8),
                            Color.orange,
                            Color.red.opacity(0.7),
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
            }
            .chartAngleSelection(value: .constant(progress))
            .chartBackground { _ in
                Color.clear
            }
            .frame(width: 250, height: 250)
            .rotationEffect(.degrees(-90))  // Start from top

            // Center content
            VStack(spacing: 8) {
                // Fire emoji
                Text("🔥")
                    .font(.system(size: 30))
                    .scaleEffect(1.0 + (animatedProgress * 0.08))
                    .animation(.easeOut(duration: 0.35), value: animatedProgress)

                // Current calories
                Text("\(Int(currentCalories)) kcal")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(Styles.Colors.primaryText)
                    .scaleEffect(1.0 + (animatedProgress * 0.06))
                    .animation(.spring(response: 0.4, dampingFraction: 0.7), value: animatedProgress)
                DatePicker("", selection: $selectedDate, displayedComponents: .date)
                    .labelsHidden()
                    .glassEffect()
                    .id(calendarId)
                    .onChange(of: selectedDate) { oldValue, newValue in
                        let components = Calendar.current.dateComponents(
                            [.year, .month], from: oldValue, to: newValue)
                        guard components.year == 0 && components.month == 0 else {
                            return
                        }
                        calendarId += 1
                    }

            }
        }
        .frame(maxWidth: 250, maxHeight: 250)
        .onAppear {
            // animate into the current progress
            animatedProgress = 0.0
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                animatedProgress = progress
            }
        }
        .onChange(of: progress) { _, newValue in
            withAnimation(.spring(response: 0.45, dampingFraction: 0.75)) {
                animatedProgress = newValue
            }
        }
    }
}
