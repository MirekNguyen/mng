import SwiftUI

struct FoodItemRow: View {
    let weight: String
    let foodName: String
    let protein: String
    let calories: String
    let time: String
    @State private var isVisible: Bool = false

    var body: some View {
        HStack(spacing: 16) {
            // 1. Weight container (Stays fixed)
            Text(weight)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.gray)
                .frame(width: 70, height: 32)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.gray.opacity(0.1))
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )

            // 2. Food info (Middle section)
            // We use maxWidth: .infinity here to act as the "Spacer"
            VStack(alignment: .leading, spacing: 2) {
                Text(foodName)
                    .font(.system(size: 16, weight: .medium))
                    .lineLimit(2)                          // Limit to 2 lines
                    .multilineTextAlignment(.leading)      // Ensure left alignment if it wraps
                    .fixedSize(horizontal: false, vertical: true) // Allow it to grow vertically up to the line limit

                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.orange)
                        .frame(width: 8, height: 8)

                    Text(protein)
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    Text(time.prefix(5))
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading) // Takes up remaining space

            // 3. Calories (Right section)
            Text(calories)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.gray)
                .layoutPriority(1) // IMPORTANT: Ensures this view is never squished
        }
        .padding(.vertical, 16)
        .opacity(isVisible ? 1 : 0)
        .offset(x: isVisible ? 0 : 12, y: 0)
        .animation(.spring(response: 0.45, dampingFraction: 0.8, blendDuration: 0), value: isVisible)
        .onAppear {
            isVisible = true
        }
    }
}
