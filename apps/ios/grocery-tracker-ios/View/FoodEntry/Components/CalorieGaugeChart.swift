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
        .orange
    }

    var progressGradient: AngularGradient {
        AngularGradient(
            gradient: Gradient(colors: [
                Color(red: 1.0, green: 0.7, blue: 0.3),
                Color(red: 1.0, green: 0.6, blue: 0.2),
                Color(red: 1.0, green: 0.65, blue: 0.25)
            ]),
            center: .center,
            startAngle: .degrees(-90),
            endAngle: .degrees(-90 + 360 * Double(animatedProgress))
        )
    }

    var body: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.1), lineWidth: 24)
                    .frame(width: 220, height: 220)

                Circle()
                    .trim(from: 0, to: animatedProgress)
                    .stroke(progressGradient, style: StrokeStyle(lineWidth: 24, lineCap: .round))
                    .frame(width: 220, height: 220)
                    .rotationEffect(.degrees(-90))
                    .shadow(color: progressColor.opacity(0.3), radius: 10, x: 0, y: 5)

                VStack(spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 3) {
                        Text("\(Int(currentCalories))")
                            .font(.system(size: 50, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                            .monospacedDigit()
                        
                        Text("kcal")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.secondary)
                            .offset(y: -2)
                    }

                    Text("of \(Int(targetCalories))")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.secondary.opacity(0.8))
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
