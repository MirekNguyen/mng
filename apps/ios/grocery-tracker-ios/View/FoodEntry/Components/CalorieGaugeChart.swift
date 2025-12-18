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

    var progressColor: Color {
        switch progress {
        case 0..<0.7: return .green
        case 0.7..<0.9: return .orange
        default: return .red
        }
    }

    var progressGradient: AngularGradient {
        AngularGradient(
            gradient: Gradient(colors: [
                progressColor.opacity(0.7),
                progressColor,
                progressColor.opacity(0.9)
            ]),
            center: .center,
            startAngle: .degrees(0),
            endAngle: .degrees(360 * Double(animatedProgress))
        )
    }

    var body: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.08), lineWidth: 26)
                    .frame(width: 220, height: 220)

                Circle()
                    .trim(from: 0, to: animatedProgress)
                    .stroke(progressGradient, style: StrokeStyle(lineWidth: 26, lineCap: .round))
                    .frame(width: 220, height: 220)
                    .rotationEffect(.degrees(-90))
                    .shadow(color: progressColor.opacity(0.4), radius: 8, x: 0, y: 4)

                VStack(spacing: 4) {
                    HStack(alignment: .lastTextBaseline, spacing: 4) {
                        Text("\(Int(currentCalories))")
                            .font(.system(size: 54, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        
                        Text("kcal")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.secondary)
                    }

                    Text("of \(Int(targetCalories))")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }

            dateNavigationView
        }
        .padding(.vertical, 20)
        .onAppear {
            animatedProgress = 0.0
            withAnimation(.spring(response: 0.8, dampingFraction: 0.75)) {
                animatedProgress = progress
            }
        }
        .onChange(of: progress) { _, newValue in
            withAnimation(.spring(response: 0.6, dampingFraction: 0.75)) {
                animatedProgress = newValue
            }
        }
    }
    
    private var dateNavigationView: some View {
        HStack(spacing: 16) {
            Button(action: previousDay) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                    .frame(width: 32, height: 32)
                    .background(Color.gray.opacity(0.15))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            
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
                .gesture(
                    DragGesture(minimumDistance: 30)
                        .onEnded { value in
                            if value.translation.width > 0 {
                                previousDay()
                            } else if value.translation.width < 0 {
                                nextDay()
                            }
                        }
                )
            
            Button(action: nextDay) {
                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                    .frame(width: 32, height: 32)
                    .background(Color.gray.opacity(0.15))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
        }
    }
    
    private func previousDay() {
        let newDate = Calendar.current.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
        selectedDate = newDate
    }
    
    private func nextDay() {
        let newDate = Calendar.current.date(byAdding: .day, value: 1, to: selectedDate) ?? selectedDate
        selectedDate = newDate
    }
}
